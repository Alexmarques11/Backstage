const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authPool = require("../db/authDb");
const userModel = require("../model/userModel");
const { getChannel } = require("../utils/rabbitmq");

require("dotenv").config();

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

// Registar novo utilizador
exports.registerUser = async (userData) => {
  const { name, lastname, birthdate, username, email, password, genres } =
    userData;

  // Verificar se o email ou username já existem
  const emailExists = await userModel.findByEmail(email);
  if (emailExists.rows.length > 0) throw new Error("Email already in use");

  const usernameExists = await userModel.findByUsername(username);
  if (usernameExists.rows.length > 0)
    throw new Error("Username already in use");

  // Validar senha
  if (password.length < 8)
    throw new Error("Password must be at least 8 characters");

  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar utilizador
  const userResult = await userModel.createUser([
    name,
    lastname,
    birthdate,
    username,
    email,
    hashedPassword,
  ]);
  const userId = userResult.rows[0].id;

  // Inserir gêneros musicais (se houver)
  if (genres && Array.isArray(genres) && genres.length > 0) {
    const genreIdsResult = await authPool.query(
      `SELECT id FROM music_genres WHERE name = ANY($1)`,
      [genres]
    );
    const genreIds = genreIdsResult.rows.map((g) => g.id);

    for (const genreId of genreIds) {
      await authPool.query(
        `INSERT INTO users_genres (user_id, genre_id) VALUES ($1, $2)`,
        [userId, genreId]
      );
    }
  }

  const finalGenresResult = await authPool.query(
    `SELECT mg.name
     FROM users_genres ug
     JOIN music_genres mg ON ug.genre_id = mg.id
     WHERE ug.user_id = $1`,
    [userId]
  );

  const finalGenres = finalGenresResult.rows.map((r) => r.name);

  // ----------------------------
  // 📤 PUBLICAR MENSAGEM NO RABBITMQ
  // ----------------------------
  try {
    const channel = getChannel();
    const exchange = "users";
    const routingKey = "user.created";

    await channel.assertExchange(exchange, "topic", { durable: true });

    const message = {
      userId: userId,
      name,
      lastname,
      username,
      email,
      genres: finalGenres,
      createdAt: new Date().toISOString(),
    };

    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));

    console.log("📨 RabbitMQ → user.created:", message);
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem RabbitMQ:", err);
    // NÃO faz throw, o registo não deve falhar por falha de MQ
  }

  // Resposta normal
  return { message: "User registered successfully!" };
};

// Login de utilizador
exports.loginUser = async (credentials) => {
  const { username, email, password } = credentials;

  const userResult = await userModel.findByUsernameOrEmail(username, email);
  if (userResult.rows.length === 0) throw new Error("User not found");

  const user = userResult.rows[0];

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error("Incorrect password");

  const userPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(userPayload);

  // Criar refresh token com expiração de 7 dias
  const refreshToken = jwt.sign(userPayload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias de validade

  await authPool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, hashedRefreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
};

// Refresh token
exports.tokenUser = async (refreshToken) => {
  if (!refreshToken) throw new Error("Token missing");

  const tokensResult = await authPool.query(`SELECT * FROM refresh_tokens`);
  const matched = tokensResult.rows.find(
    (rt) =>
      bcrypt.compareSync(refreshToken, rt.token) &&
      new Date(rt.expires_at) > new Date()
  );

  if (!matched) throw new Error("Refresh token not found or expired");

  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) reject(new Error("Invalid token"));

      const accessToken = generateAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
      });
      resolve({ accessToken });
    });
  });
};

// Logout de utilizador
exports.logoutUser = async (token) => {
  if (!token) throw new Error("Refresh token is required");

  const tokensResult = await authPool.query(`SELECT * FROM refresh_tokens`);
  let matched = null;

  for (const rt of tokensResult.rows) {
    if (await bcrypt.compare(token, rt.token)) {
      matched = rt;
      break;
    }
  }

  if (!matched) throw new Error("Invalid or already removed refresh token");

  await userModel.deleteTokenById(matched.id);
  return { message: "Logout successful" };
};
