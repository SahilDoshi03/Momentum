import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../models/User';
import { config } from './index';

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId).select('-password');
    if (user && user.active) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
if (config.googleClientId && config.googleClientSecret) {
  passport.use(new GoogleStrategy({
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    callbackURL: config.googleCallbackUrl,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user);
      }

      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails?.[0]?.value });

      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.profileIcon = {
          url: profile.photos?.[0]?.value,
          initials: user.initials,
          bgColor: user.profileIcon?.bgColor || '#6366f1'
        };
        await user.save();
        return done(null, user);
      }

      // Create new user
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found from Google'), false);
      }
      const name = profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName;
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

      user = new User({
        email,
        username: email.split('@')[0] + '_' + Date.now(),
        fullName: name,
        initials,
        googleId: profile.id,
        profileIcon: {
          url: profile.photos?.[0]?.value,
          initials,
          bgColor: '#6366f1'
        },
        role: 'member',
        active: true,
      });

      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
}

// GitHub OAuth Strategy
if (config.githubClientId && config.githubClientSecret) {
  passport.use(new GitHubStrategy({
    clientID: config.githubClientId,
    clientSecret: config.githubClientSecret,
    callbackURL: config.githubCallbackUrl,
    scope: ['user:email'],
    userAgent: 'MomentumApp',
  }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
    try {
      // Check if user already exists with this GitHub ID
      let user = await User.findOne({ githubId: profile.id });

      if (user) {
        return done(null, user);
      }

      // Check if user exists with same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await User.findOne({ email });
        if (user) {
          // Link GitHub account to existing user
          user.githubId = profile.id;
          if (!user.profileIcon?.url && profile.photos?.[0]?.value) {
            user.profileIcon = {
              url: profile.photos[0].value,
              initials: user.initials,
              bgColor: user.profileIcon?.bgColor || '#6366f1'
            };
          }
          await user.save();
          return done(null, user);
        }
      }

      // Create new user
      if (!email) {
        return done(new Error('No email found from GitHub'), false);
      }
      const name = profile.displayName || profile.username || 'GitHub User';
      const initials = name.split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2);

      user = new User({
        email,
        username: profile.username || `github_${profile.id}`,
        fullName: name,
        initials,
        githubId: profile.id,
        profileIcon: {
          url: profile.photos?.[0]?.value,
          initials,
          bgColor: '#6366f1'
        },
        role: 'member',
        active: true,
      });

      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;



