using CoreWCF;
using CoreWCF.Channels;
using CoreWCF.Configuration;
using CoreWCF.Description;
using CoreWCF.Queue.Common.Configuration;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using RideSharing.Contracts;
using RideSharing.WebServices.Services;
using RideSharing.WebServices.Stores;
using System;

namespace RideSharing.WebServices
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddServiceModelServices();
            services.AddServiceModelMetadata();
            services.AddQueueTransport();

            services.AddSingleton<IServiceBehavior, UseRequestHeadersForMetadataAddressBehavior>();
            services.AddSingleton<IRideRequestStore, InMemoryRideRequestStore>();
            services.AddTransient<RideBookingService>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app)
        {
            app.UseServiceModel(serviceBuilder =>
            {
                // Existing HTTP service
                serviceBuilder.AddService<Service>();
                serviceBuilder.AddServiceEndpoint<Service, IService>(
                    new BasicHttpBinding(BasicHttpSecurityMode.Transport), "/Service.svc");

                // RabbitMQ ride booking service
                serviceBuilder.AddService<RideBookingService>();
                serviceBuilder.AddServiceEndpoint<RideBookingService, IRideBookingService>(
                    new RabbitMqBinding(),
                    new Uri("net.amqp://localhost/ride_booking_exchange/ride_booking_queue"));

                // HTTP endpoint for request-reply ride status queries
                serviceBuilder.AddServiceEndpoint<RideBookingService, IRideStatusService>(
                    new BasicHttpBinding(BasicHttpSecurityMode.Transport), "/RideStatusService.svc");

                var serviceMetadataBehavior = app.ApplicationServices.GetRequiredService<ServiceMetadataBehavior>();
                serviceMetadataBehavior.HttpsGetEnabled = true;
            });
        }
    }
}
