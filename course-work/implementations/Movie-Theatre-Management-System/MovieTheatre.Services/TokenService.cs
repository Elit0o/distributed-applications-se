using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Contracts.Settings;
using MovieTheatre.Data.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MovieTheatre.Services
{
    public class TokenService : ITokenService
    {
        private readonly TokenSettings _settings;

        public TokenService(IOptions<TokenSettings> settings)
        {
            _settings = settings.Value;
        }

        public string CreateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_settings.SecurityKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            Claim[] claims = new Claim[]
            {
                new Claim("isAdmin", user.IsAdmin.ToString()),
                new Claim("loggedUserId", user.Id.ToString())
            };

            JwtSecurityToken token = new JwtSecurityToken
                (
                    issuer: _settings.Issuer,
                    audience: _settings.Audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddHours(_settings.ExpireTime),
                    signingCredentials: credentials
                );
            
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
