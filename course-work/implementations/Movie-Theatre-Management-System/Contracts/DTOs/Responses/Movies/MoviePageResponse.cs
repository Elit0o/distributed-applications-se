namespace MovieTheatre.Contracts.DTOs.Responses.Movies
{
    public class MoviePageResponse : PageResponse<MovieResponse>
    {
        public string? Title { get; set; }
        public string? Genre { get; set; }
    }
}
