# FNFestival.co

This is the repository for the [FNFestival.co](https://fnfestival.co) website, where you can view the daily and generally available jam tracks for the Fortnite Festival mode.

## How does it work?

The list of all available jam tracks can be found on the public Fortnite Content API at [this link](https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/spark-tracks).

However, in order to retrieve the daily jam tracks, authentication is required. To do this, we use the [`fnbr.js`](https://github.com/fnbrjs/fnbr.js) library and then query the event flags that contain the daily jam tracks.

Using a [GitHub workflow](.github/workflows/update-jam-tracks.yml), we then run [the script](scripts/index.js) to update the jam tracks every day at midnight (0:00 UTC). We use a Cloudflare Worker to trigger the workflow because GitHub Action cronjobs are too delayed.

## Authentication

To retrieve the daily jam tracks, authentication with the Fortnite client/Epic Games is required. Follow these steps:

1. Run `npm run auth` to start the authentication process.
2. You will be asked for an authorization code. Obtain it from [this link](https://www.epicgames.com/id/logout?redirectUrl=https%3A//www.epicgames.com/id/login%3FredirectUrl%3Dhttps%253A%252F%252Fwww.epicgames.com%252Fid%252Fapi%252Fredirect%253FclientId%253D3f69e56c7649492c8cc29f1af08a8a12%2526responseType%253Dcode).
3. After logging in, you will receive a JSON response containing the authorization code.
4. Enter the authorization code when prompted.
5. A `deviceAuth.json` file will be created, containing the `accountId`, `deviceId`, and `secret`.
6. Set these values as environment variables for the GitHub Action.

This process allows the script to connect to the Epic Games/Fortnite endpoints and request the events for Fortnite, including the daily jam tracks.

## Thanks to

- [Fortnite & Epic Games Unofficial API Documentation](https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation)
- [Fortnite.gg](https://fortnite.gg) for some inspiration

## Contributing

This project was created rather quickly and there are many things that could be improved or added.

If you feel like it, you can help us out by making a pull request.
