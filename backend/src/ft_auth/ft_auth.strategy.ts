import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import fetchFtUser from './ft_auth.ft_api';

@Injectable()
export class FortytwoStrategy extends PassportStrategy(
  Strategy,
  'oauth2',
) {
  constructor(private config: ConfigService) {
    super(
      {
        authorizationURL: config.get('FORTYTWO_AUTHOR_URL'),
        tokenURL: config.get('FORTYTWO_TOKEN_URL'),
        clientID: config.get('FORTYTWO_CLIENTID'),
        clientSecret: config.get('FORTYTWO_CLIENTSECRET'),
        callbackURL: config.get('FORTYTWO_CALLBACK_URL'),
        scope: 'public',
      },
      async function (
        accessToken: string,
        refreshToken: string,
        profile: any,
        cb: any,
      ) {
        return await fetchFtUser(accessToken, cb);
      },
    );
  }
}
