namespace MovieTheatre.Contracts.DTOs.Requests.Movies
{
    public class MoviePageRequest : PageRequest
    {
        public string? Title { get; set; }
        public string? Genre { get; set; }
    }
}
