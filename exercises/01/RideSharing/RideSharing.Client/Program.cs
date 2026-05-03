using CoreWCF.ServiceModel.Channels;
using RideSharing.Contracts;
using System;
using System.Collections.Generic;
using System.ServiceModel;

namespace RideSharing.Client;

class Program
{
    private static readonly List<Guid> myRideIds = [];

    static void Main(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        // RabbitMQ channel for one-way ride requests
        var rabbitBinding = new RabbitMqBinding();
        var rabbitEndpoint = new EndpointAddress(
            new Uri("net.amqp://localhost/ride_booking_exchange/ride_booking_queue"));

        using var rabbitFactory = new ChannelFactory<IRideBookingService>(rabbitBinding, rabbitEndpoint);
        rabbitFactory.Credentials.UserName.UserName = "guest";
        rabbitFactory.Credentials.UserName.Password = "guest";
        var bookingClient = rabbitFactory.CreateChannel();

        // HTTP channel for request-reply status queries
        var httpBinding = new BasicHttpBinding(BasicHttpSecurityMode.Transport);
        var httpEndpoint = new EndpointAddress(
            new Uri("https://localhost:7159/RideStatusService.svc"));

        using var httpFactory = new ChannelFactory<IRideStatusService>(httpBinding, httpEndpoint);
        var statusClient = httpFactory.CreateChannel();

        Console.WriteLine("=== RideSharing Client ===");

        while (true)
        {
            Console.WriteLine();
            Console.WriteLine("1. Request a Ride");
            Console.WriteLine("2. Check Ride Status");
            Console.WriteLine("3. Cancel Ride");
            Console.WriteLine("4. Exit");
            Console.Write("Select an option: ");

            var choice = Console.ReadLine()?.Trim();

            switch (choice)
            {
                case "1":
                    RequestRide(bookingClient);
                    break;
                case "2":
                    CheckRideStatus(statusClient);
                    break;
                case "3":
                    CancelRide(bookingClient);
                    break;
                case "4":
                    Console.WriteLine("Goodbye!");
                    return;
                default:
                    Console.WriteLine("Invalid option. Please enter 1, 2, 3, or 4.");
                    break;
            }
        }
    }

    private static void RequestRide(IRideBookingService bookingClient)
    {
        try
        {
            Console.Write("Enter Pickup Location: ");
            var pickup = Console.ReadLine()?.Trim();

            Console.Write("Enter Dropoff Location: ");
            var dropoff = Console.ReadLine()?.Trim();

            if (string.IsNullOrWhiteSpace(pickup) || string.IsNullOrWhiteSpace(dropoff))
            {
                Console.WriteLine("Pickup and Dropoff locations cannot be empty.");
                return;
            }

            var request = new RideRequest
            {
                RequestId = Guid.NewGuid(),
                PickupLocation = pickup,
                DropoffLocation = dropoff,
                Status = RideStatus.Created
            };

            bookingClient.RequestRide(request);
            myRideIds.Add(request.RequestId);

            Console.WriteLine($"Ride requested with ID: {request.RequestId}");
        }
        catch (TimeoutException ex)
        {
            Console.WriteLine($"Request timed out: {ex.Message}");
        }
        catch (CommunicationException ex)
        {
            Console.WriteLine($"Communication error: {ex.Message}");
        }
    }

    private static void CheckRideStatus(IRideStatusService statusClient)
    {
        try
        {
            if (myRideIds.Count > 0)
            {
                Console.WriteLine("Your ride IDs from this session:");
                for (int i = 0; i < myRideIds.Count; i++)
                {
                    Console.WriteLine($"  [{i + 1}] {myRideIds[i]}");
                }
            }
            else
            {
                Console.WriteLine("No rides requested in this session yet.");
            }

            Console.Write("Enter Request ID: ");
            var input = Console.ReadLine()?.Trim();

            if (!Guid.TryParse(input, out var requestId))
            {
                Console.WriteLine("Invalid GUID format.");
                return;
            }

            var status = statusClient.GetRideStatus(requestId);
            Console.WriteLine($"Ride {requestId} status: {status}");
        }
        catch (TimeoutException ex)
        {
            Console.WriteLine($"Request timed out: {ex.Message}");
        }
        catch (CommunicationException ex)
        {
            Console.WriteLine($"Communication error: {ex.Message}");
        }
        catch (FormatException ex)
        {
            Console.WriteLine($"Invalid input format: {ex.Message}");
        }
    }

    private static void CancelRide(IRideBookingService bookingClient)
    {
        try
        {
            if (myRideIds.Count > 0)
            {
                Console.WriteLine("Your ride IDs from this session:");
                for (int i = 0; i < myRideIds.Count; i++)
                {
                    Console.WriteLine($"  [{i + 1}] {myRideIds[i]}");
                }
            }
            else
            {
                Console.WriteLine("No rides requested in this session yet.");
            }

            Console.Write("Enter Request ID to cancel: ");
            var input = Console.ReadLine()?.Trim();

            if (!Guid.TryParse(input, out var requestId))
            {
                Console.WriteLine("Invalid GUID format.");
                return;
            }

            bookingClient.CancelRide(requestId);

            Console.WriteLine("Ride cancelled successfully!");
        }
        catch (TimeoutException ex)
        {
            Console.WriteLine($"Request timed out: {ex.Message}");
        }
        catch (CommunicationException ex)
        {
            Console.WriteLine($"Communication error: {ex.Message}");
        }
    }
}
