
// OR gate: passes if ANY middleware succeeds
exports.OrGate = (...middlewares) => {
  if (middlewares.length < 2) {
    throw new Error("OrGate requires at least two middlewares");
  }

  return async (req, res, next) => {
    let index = 0;
    let errors = [];

    const tryNext = () => {
      if (index >= middlewares.length) {
        // All middlewares failed
        return res.status(403).json({ message: errors });
      }

      const middleware = middlewares[index++];

      // Mock response to catch failures
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            // This middleware failed, try the next one
            errors.push(data);
            tryNext();
            return mockRes;
          },
        }),
      };

      // If middleware calls next(), it succeeded
      middleware(req, mockRes, () => {
        // Success! Call the real next
        next();
      });
    };

    tryNext();
  };
};