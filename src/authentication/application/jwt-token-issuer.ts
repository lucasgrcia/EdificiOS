export type IssuedAccessToken = {
  accessToken: string;
  expiresIn: number;
};

export interface JwtTokenIssuer {
  issueAccessToken(userId: string): IssuedAccessToken;
}
