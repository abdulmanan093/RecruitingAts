using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using RecruitingAts.Api.Auth;
using RecruitingAts.Api.Data;

namespace RecruitingAts.Tests;

public class AuthenticationPermissionTests
{
    [Fact]
    public async Task ExistingCookie_RefreshesAddedAndRemovedRolePermissions()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        services.AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();
        services.AddScoped<IUserClaimsPrincipalFactory<ApplicationUser>, AppClaimsPrincipalFactory>();
        services.Configure<SecurityStampValidatorOptions>(options =>
            options.ValidationInterval = TimeSpan.Zero);

        await using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var factory = scope.ServiceProvider.GetRequiredService<IUserClaimsPrincipalFactory<ApplicationUser>>();

        var role = new IdentityRole(AppRoles.Admin);
        Assert.True((await roles.CreateAsync(role)).Succeeded);
        var user = new ApplicationUser { UserName = "permission-test@example.test" };
        Assert.True((await users.CreateAsync(user)).Succeeded);
        Assert.True((await users.AddToRoleAsync(user, AppRoles.Admin)).Succeeded);

        var oldPrincipal = await factory.CreateAsync(user);
        Assert.False(oldPrincipal.HasClaim(Permissions.ClaimType, Permissions.RequisitionsApprove));

        var permission = new Claim(Permissions.ClaimType, Permissions.RequisitionsApprove);
        Assert.True((await roles.AddClaimAsync(role, permission)).Succeeded);
        var refreshed = await ValidateCookieAsync(scope.ServiceProvider, oldPrincipal);
        Assert.True(refreshed.HasClaim(Permissions.ClaimType, Permissions.RequisitionsApprove));

        Assert.True((await roles.RemoveClaimAsync(role, permission)).Succeeded);
        var revoked = await ValidateCookieAsync(scope.ServiceProvider, refreshed);
        Assert.False(revoked.HasClaim(Permissions.ClaimType, Permissions.RequisitionsApprove));
    }

    private static async Task<ClaimsPrincipal> ValidateCookieAsync(
        IServiceProvider services,
        ClaimsPrincipal principal)
    {
        var http = new DefaultHttpContext { RequestServices = services, User = principal };
        services.GetRequiredService<IHttpContextAccessor>().HttpContext = http;
        var scheme = new AuthenticationScheme(
            IdentityConstants.ApplicationScheme, null, typeof(CookieAuthenticationHandler));
        var options = services.GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.ApplicationScheme);
        var ticket = new AuthenticationTicket(principal, new AuthenticationProperties
        {
            IssuedUtc = DateTimeOffset.UtcNow.AddMinutes(-1)
        }, IdentityConstants.ApplicationScheme);
        var context = new CookieValidatePrincipalContext(http, scheme, options, ticket);

        await options.Events.ValidatePrincipal(context);

        Assert.NotNull(context.Principal);
        Assert.True(context.ShouldRenew);
        return context.Principal;
    }
}
