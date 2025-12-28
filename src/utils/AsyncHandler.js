const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
      // res.status(error.statusCode || 500).json(error)
    );
  };
};


export { asyncHandler };