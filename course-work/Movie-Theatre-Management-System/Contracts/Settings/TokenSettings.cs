namespace MovieTheatre.Contracts.Settings
{
    public class TokenSettings
    {
        public string SecurityKey { get; set; }
        public string Issuer { get; set; }
        public string Audience { get; set; }
        public int ExpireTime { get; set; }
    }
}
