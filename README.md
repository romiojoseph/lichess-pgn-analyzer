# Lichess PGN Analyzer

### A bit about the project

First of all, you can see an in-depth analysis on Lichess itself. Visit your profile and click on the "Chess insights" button. You can use many filters and combinations to see different types of insights, and there are also a few filter presets. You can view others' insights by changing the `{username}` in this URL:  
[https://lichess.org/insights/{username}/acpl/variant](https://lichess.org/insights/{username}/acpl/variant).  
The preloaded data is from a bot on Lichess. I'm just using it as a sample. Credits to that person who made the bot.

I started [playing chess again](https://romio.substack.com/p/getting-back-into-chess) a few months ago and now I play almost daily. I switched from Chess.com to Lichess because [I prefer open platforms](https://romio.substack.com/p/open-design-tools-data-ownership-portability) with fewer restrictions. I'm still a beginner, hovering between 1,000 and 1,150, but I enjoy every game, win or lose.

After watching [The Queen's Gambit](https://g.co/kgs/GHLyhg8), I started creating scripts and projects to analyze games. With Lichess's openness, we can look at other players' games, learn a few tips, or find our own weaknesses. Running scripts can be technical, so I built a front end to make it easier for anyone to use.

I found many calculation errors while building this, so I created a [Python script](https://github.com/romiojoseph/open-source/tree/main/chess/analyze-pgn) to cross-check the data. I used the same logic in the JavaScript, and now everything matches. The Python script also converts relevant details from PGN files into CSV format, making it easier to filter or review all the games conveniently. I tested multiple scenarios, and the numbers are consistent across the CSV, the script outputs, and the JavaScript analysis. However, if you find any irregularities or errors, please let me know.

No data is sent anywhere—everything runs in your browser. You can check out the project on [GitHub](https://github.com/romiojoseph/lichess-pgn-analyzer). I developed the entire JavaScript using LLMs (Mistal AI, Claude, and Google AI Studio). Chart library by [Apache ECharts](https://echarts.apache.org/en/index.html). Because of the bugs, there were times I wanted to [abandon](https://bsky.app/profile/romiojoseph.github.io/post/3lcevdbfu5c2y) this project, but after a good night's sleep and with the help of Cursor, I kept going and finally finished it. 

There are no analytics tools or trackers used here, so feel free to browse away with peace of mind. You can find a few scripts I've created for chess analysis [here](https://github.com/romiojoseph/open-source/tree/main/chess). And if you want to know the combined stats of your Chess.com and Lichess profiles, [visit this link](https://romiojoseph.github.io/open-source/unified-chess-stats-tracker-web/).

