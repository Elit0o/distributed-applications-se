using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Contracts.DTOs.Requests.Users
{
    public class UserRequest
    {
        [MaxLength(20)]
        public string? FName { get; set; }

        [MaxLength(20)]
        public string? LName { get; set; }

        [MinLength(2)]
        [MaxLength(20)]
        [Required(ErrorMessage = "Username cannot be empty")]
        public required string Username { get; set; }

        [MinLength(5)]
        [MaxLength(20)]
        [Required(ErrorMessage = "Password cannot be empty")]
        public required string PasswordHash { get; set; }

        [Required(ErrorMessage = "Birth date cannot be empty")]
        public DateTime Birthday { get; set; }
        public bool? IsAdmin { get; set; }
    }
}
