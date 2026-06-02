using Microsoft.AspNetCore.Mvc;
using MovieTheatre.Contracts.DTOs.Requests;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.WebServices.Exceptions;

namespace MovieTheatre.WebServices.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ITokenService _tokenService;
        private readonly IUserService _userService;

        public AuthController(ITokenService tokenService, IUserService userService)
        {
            _tokenService = tokenService;
            _userService = userService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateToken([FromForm] AuthTokenRequest authTokenRequest) 
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }

            User? user = (await _userService.GetAllAsync()).FirstOrDefault(u => u.Username == authTokenRequest.Username && u.PasswordHash == authTokenRequest.PasswordHash);

            if (user == null) 
            {
                throw new BadRequestException("Wrong username or password.");
            }

            var token = _tokenService.CreateToken(user);
            return Ok(new { token });
        }
    }
}
