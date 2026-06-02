using MovieTheatre.Contracts.DTOs.Responses.Screenings;

namespace MovieTheatre.Contracts.DTOs.Responses.Movies
{
    public class MovieDetailsResponse
    {
        public string Title { get; set; }
        public string Genre { get; set; }
        public DateTime ReleaseDate { get; set; }
        public int DurationMinutes { get; set; }
        public string Description { get; set; }
        public float Rating { get; set; }

        public List<ScreeningResponse> Screenings{ get; set; }
    }
}
