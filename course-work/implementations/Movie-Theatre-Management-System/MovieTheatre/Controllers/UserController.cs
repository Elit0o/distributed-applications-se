using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTheatre.Contracts.DTOs.Requests.Users;
using MovieTheatre.Contracts.DTOs.Responses.User;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.WebServices.Exceptions;
using System.Security.Claims;

namespace MovieTheatre.WebServices.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery]UserPageRequest userPageRequest) 
        {
            if (!User.HasClaim("isAdmin", "True")) 
            {
                return Forbid();
            }

            UserPageResponse userPageResponse = await _userService.GetPagedAllUsers(userPageRequest);
            return Ok(userPageResponse);
        }

        [Authorize]
        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get([FromRoute] Guid id) 
        {
            Guid loggedUserId = Guid.Parse(User.FindFirstValue("loggedUserId"));
            if (loggedUserId != id && !User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }

            User? user = await _userService.GetByIdAsync(id);
            if (user is null)
            {
                throw new NotFoundException($"User with id {id} not found");
            }

            UserDetailsResponse userDetailsResponse = _userService.MapToResponse(user);
            return Ok(userDetailsResponse);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody]UserRequest userRequest)
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }

            if (userRequest.IsAdmin == true && !User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }

            if (await _userService.CheckUsername(userRequest.Username))
            {
                throw new BadRequestException("Username is already taken.");
            }

            User user = _userService.CreateUser(userRequest);
            await _userService.AddAsync(user);
            return Created();
        }

        [Authorize]
        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Update([FromBody] UserRequest userRequest, [FromRoute] Guid id) 
        {
            if (!ModelState.IsValid)
            {
                throw new BadRequestException("Invalid data");
            }
            Guid loggedUserId = Guid.Parse(User.FindFirstValue("loggedUserId"));
            if (loggedUserId != id && !User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }

            User? user = await _userService.GetByIdAsync(id);
            if (user is null)
            {
                throw new NotFoundException($"User with id {id} not found");
            }

            if (user.Username != userRequest.Username && await _userService.CheckUsername(userRequest.Username))
            {
                throw new BadRequestException("Username is already taken.");
            }

            if (!User.HasClaim("isAdmin", "True"))
            {
                userRequest.IsAdmin = false;
            }

            User updated = _userService.UpdateUser(userRequest, user);
            await _userService.UpdateAsync(updated);
            UserDetailsResponse userResponse = _userService.MapToResponse(updated);
            return Ok(userResponse);
        }

        [Authorize]
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete([FromRoute] Guid id) 
        {
            Guid loggedUserId = Guid.Parse(User.FindFirstValue("loggedUserId"));
            if (loggedUserId != id && !User.HasClaim("isAdmin", "True"))
            {
                return Forbid();
            }

            User? user = await _userService.GetByIdAsync(id);
            if (user is null)
            {
                throw new NotFoundException($"User with id {id} not found");
            }

            UserDetailsResponse userResponse = _userService.MapToResponse(user);
            await _userService.DeleteAsync(user);
            return Ok(userResponse);
        }
    }
}
