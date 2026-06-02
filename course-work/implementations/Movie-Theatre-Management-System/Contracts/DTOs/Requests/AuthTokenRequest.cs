using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Contracts.DTOs.Requests
{
    public class AuthTokenRequest
    {
        [MinLength(2)]
        [MaxLength(20)]
        [Required(ErrorMessage = "Username cannot be empty")]
        public required string Username { get; set; }

        [MinLength(5)]
        [MaxLength(20)]
        [Required(ErrorMessage = "Password cannot be empty")]
        public required string PasswordHash { get; set; }
    }
}
