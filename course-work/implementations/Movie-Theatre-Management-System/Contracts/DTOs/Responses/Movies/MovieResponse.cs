namespace MovieTheatre.Contracts.DTOs.Responses.Movies
{
    public class MovieResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Genre { get; set; }
        public DateTime ReleaseDate { get; set; }
        public int DurationMinutes { get; set; }
        public string Description { get; set; }
        public float Rating { get; set; }
    }
}
