module.exports = {
  validateLogin: (body) => (!body.email || !body.password) ? 'Email and password are required' : null,
  validateRegister: (body) => (!body.email || !body.name || !body.password) ? 'Name, email and password are required' : null
};
