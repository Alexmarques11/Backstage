
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
  
  return (req, res, next) => {
    let authorized = false;
    let errors = [];

    for (const middleware of middlewares) {
      try {
        // Mock response to catch errors
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              errors.push(data);
              return mockRes;
            },
          }),
        };

        // If middleware calls next(), it succeeded
        middleware(req, mockRes, () => {
          authorized = true;
          console.log("OrGate: Middleware succeeded:", authorized);
        });

        // If authorized, stop checking
        if (authorized) break;
      } catch (err) {
        errors.push(err.message);
      }
    }

    if (!authorized) {
      return res.status(403).json({ errors, authorized });
    }
    next();
  };
};