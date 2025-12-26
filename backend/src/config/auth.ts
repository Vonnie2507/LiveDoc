export function getAuthConfig(): { jwtSecret: string; accessTokenExpiry: string; refreshTokenExpiry: string; bcryptRounds: number } {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (jwtSecret === undefined || jwtSecret === '') {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || '15m';
  const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
  
  const bcryptRoundsEnv = process.env.BCRYPT_ROUNDS;
  let bcryptRounds = 10;
  if (bcryptRoundsEnv !== undefined) {
    const parsed = parseInt(bcryptRoundsEnv, 10);
    if (!isNaN(parsed)) {
      bcryptRounds = parsed;
    }
  }
  
  return {
    jwtSecret,
    accessTokenExpiry,
    refreshTokenExpiry,
    bcryptRounds
  };
}