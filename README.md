# FNFestival.co

This is the repository for the [FNFestival.co](https://fnfestival.co) website, where you can view the daily and generally available jam tracks for the Fortnite Festival mode.

## How does it work?

The list of all available jam tracks can be found on the public Fortnite Content API at [this link](https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/spark-tracks).

However, in order to retrieve the daily jam tracks, authentication is required. To do this, we use the [`fnbr.js`](https://github.com/fnbrjs/fnbr.js) library and then query the event flags that contain the daily jam tracks.

Using a [GitHub workflow](.github/workflows/update-jam-tracks.yml), we then run [the script](scripts/index.js) to update the jam tracks every day at 10pm and midnight (UTC).

## Thanks to

- [Fortnite & Epic Games Unofficial API Documentation](https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation)
- [Fortnite.gg](https://fortnite.gg) for some inspiration

## Contributing

This project was created rather quickly and there are many things that could be improved or added.

If you feel like it, you can help us out by making a pull request.
