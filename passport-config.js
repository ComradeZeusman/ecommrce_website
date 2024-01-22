const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

function initializePassport(passport, getUserByRegNumber, getUserById) {
  const authenticateUser = async (reg_id, password, done) => {
    const user = await getUserByRegNumber(reg_id);
    if (!user) {
      return done(null, false, { message: 'No user with that registration ID' });
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (e) {
      return done(e);
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'reg_id' }, authenticateUser));
  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    const user = await getUserById(id);
    return user ? done(null, user) : done(null, false);
  });
}

module.exports = initializePassport;
