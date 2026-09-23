module.exports = function validate(schemaFn) {
  return (req, res, next) => {
    const error = schemaFn(req.body);
    if (error) return res.status(400).json({ error });
    if (next) next();
  };
};
