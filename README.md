# FNFestival.co

This is the repository for the [FNFestival.co](https://fnfestival.co) website, where you can view the daily and generally available jam tracks for the Fortnite Festival mode.

## How does it work?

The list of all available jam tracks can be found on the public Fortnite Content API at [this link](https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/spark-tracks).

However, in order to retrieve the daily jam tracks, authentication is required. To do this, we use the [`fnbr.js`](https://github.com/fnbrjs/fnbr.js) library and then query the event flags that contain the daily jam tracks.

The jam tracks are automatically updated daily at midnight (0:00 UTC) using a [GitHub workflow](.github/workflows/update-jam-tracks.yml) that runs [the update script](scripts/update-jam-tracks.js). Because GitHub Action cron jobs are unreliable and often delayed, we use a Cloudflare Worker to trigger the workflow on schedule.

## Authentication

To retrieve the daily jam tracks, authentication with the Fortnite client/Epic Games is required. Follow these steps:

1. Run `npm run auth` to start the authentication process.
2. You will be asked for an authorization code. Obtain it from [this link](https://www.epicgames.com/id/logout?redirectUrl=https%3A//www.epicgames.com/id/login%3FredirectUrl%3Dhttps%253A%252F%252Fwww.epicgames.com%252Fid%252Fapi%252Fredirect%253FclientId%253D3f69e56c7649492c8cc29f1af08a8a12%2526responseType%253Dcode).
3. After logging in, you will receive a JSON response containing the authorization code.
4. Enter the authorization code when prompted.
5. A `deviceAuth.json` file will be created, containing the `accountId`, `deviceId`, and `secret`.
6. Set these values as secrets in your GitHub repository settings for the automated workflow.

## Updating Tracks

### Automated Updates (GitHub Actions)

The tracks are automatically updated via GitHub Actions. The workflow requires the following repository secrets:
- `FNBR_ACCOUNT_ID`
- `FNBR_DEVICE_ID`
- `FNBR_SECRET`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

These values come from the `deviceAuth.json` file created during authentication.

### Manual Updates (Windows)

To manually update tracks on Windows:

1. Set the required environment variables using the values from `deviceAuth.json`:
   ```cmd
   set FNBR_ACCOUNT_ID=your_account_id
   set FNBR_DEVICE_ID=your_device_id
   set FNBR_SECRET=your_secret
   set SPOTIFY_CLIENT_ID=your_spotify_client_id
   set SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

2. Run the update script:
   ```cmd
   npm run update:tracks
   ```

The script will fetch the latest tracks and update `data/tracks.json`.

This process allows the script to connect to the Epic Games/Fortnite endpoints and request the events for Fortnite, including the daily jam tracks.

## Thanks to

- [Fortnite & Epic Games Unofficial API Documentation](https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation)
- [Fortnite.gg](https://fortnite.gg) for some inspiration

## Contributing

This project was created rather quickly and there are many things that could be improved or added.

If you feel like it, you can help us out by making a pull request.
