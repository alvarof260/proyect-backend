import passport from 'passport'
import local from 'passport-local'
import { userDAO } from '../dao/models/users.js'
import { createHash, isValidPassword } from '../utils.js'
import GithubStrategy from 'passport-github2'

const LocalStrategy = local.Strategy

export const initializePassport = () => {
  passport.use('register', new LocalStrategy({
    passReqToCallback: true,
    usernameField: 'email'
  }, async (req, username, password, done) => {
    const { firstName, lastName, email, age } = req.body
    try {
      const user = await userDAO.findOne({ email: username })
      if (user) {
        return done(null, false)
      }
      const newUser = {
        firstName,
        lastName,
        email,
        age,
        password: createHash(password)
      }
      const result = await userDAO.create(newUser)
      return done(null, result)
    } catch (err) {
      return done(err)
    }
  }))

  passport.use('login', new LocalStrategy({
    usernameField: 'email'
  }, async (username, password, done) => {
    try {
      const user = await userDAO.findOne({ email: username })
      if (!user) {
        return done(null, user)
      }
      if (!isValidPassword(user, password)) return done(null, false)
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }))

  passport.use('github', new GithubStrategy({
    clientID: 'Iv1.c1224398f72a16e9',
    clientSecret: '43b0f6726974c1e42ea68cda4946411c4c0cb337',
    callbackURL: 'http://localhost:8080/api/session/githubcallback'
  }, async (accessToken, refeshToken, profile, done) => {
    console.log(profile)
    try {
      const user = await userDAO.findOne({ email: profile._json.email })
      if (user) return done(null, user)
      const newUser = await userDAO.create({
        firstName: profile._json.name,
        lastName: '',
        email: profile._json.email,
        password: ''
      })
      return done(null, newUser)
    } catch (err) {
      return done(err)
    }
  }))

  passport.serializeUser((user, done) => {
    done(null, user._id)
  })

  passport.deserializeUser(async (id, done) => {
    const user = await userDAO.findById(id)
    done(null, user)
  })
}