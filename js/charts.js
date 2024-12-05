function renderOpponentLevelsChart(opponentLevels) {
    const chartDom = document.getElementById('opponent-levels-container');
    if (chartDom) {
        const myChart = echarts.init(chartDom);

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    const category = params[0].axisValueLabel;
                    const levelData = opponentLevels[category];


                    let tooltipText = `Level: ${category}<br>`;
                    params.forEach(param => {
                        if (param.seriesName === 'Total Games') {
                            tooltipText += `Total Games: ${formatNumberWithCommas(param.value)}<br>`;
                        } else if (param.seriesName === 'Wins') {
                            tooltipText += `Wins: ${formatNumberWithCommas(param.value)}<br>`;
                        } else if (param.seriesName === 'Losses') {
                            tooltipText += `Losses: ${formatNumberWithCommas(param.value)}<br>`;
                        } else if (param.seriesName === 'Draws') {
                            tooltipText += `Draws: ${formatNumberWithCommas(param.value)}<br>`;
                        }
                    });

                    tooltipText += `User Resigned: ${formatNumberWithCommas(levelData.userResigned)}<br>`;
                    tooltipText += `Opponent Resigned: ${formatNumberWithCommas(levelData.opponentResigned)}<br>`;
                    tooltipText += `User Timeout: ${formatNumberWithCommas(levelData.userTimeout)}<br>`;
                    tooltipText += `Opponent Timeout: ${formatNumberWithCommas(levelData.opponentTimeout)}`;

                    return tooltipText;
                },
                textStyle: { fontSize: 15, fontFamily: 'Noto Sans, sans-serif', color: '#09090b' },
                backgroundColor: '#fafafa', borderColor: '#e4e4e7', borderWidth: 1, borderRadius: 8, padding: 16
            },
            legend: { data: ['Total Games', 'Wins', 'Losses', 'Draws'], left: 'left', top: 'top' },
            grid: { left: '2%', right: '2%', bottom: '2%', containLabel: true },
            xAxis: { type: 'category', data: Object.keys(opponentLevels), axisLabel: { rotate: 45, interval: 0 } },
            yAxis: [
                { type: 'value', name: 'Total Games', axisLabel: { formatter: '{value}' } },
                { type: 'value', name: 'Wins/Losses/Draws', axisLabel: { formatter: '{value}' } }
            ],
            series: [
                {
                    name: 'Total Games', type: 'bar', data: Object.values(opponentLevels).map(level => level.total),
                    itemStyle: { color: '#203ce2' }
                },
                {
                    name: 'Wins', type: 'line', yAxisIndex: 1, data: Object.values(opponentLevels).map(level => level.won),
                    itemStyle: { color: '#77DD77' }
                },
                {
                    name: 'Losses', type: 'line', yAxisIndex: 1, data: Object.values(opponentLevels).map(level => level.loss),
                    itemStyle: { color: '#FF6961' }
                },
                {
                    name: 'Draws', type: 'line', yAxisIndex: 1, data: Object.values(opponentLevels).map(level => level.draw),
                    itemStyle: { color: '#FFB347' }
                }
            ]
        };

        myChart.setOption(option);
    }
}

function renderEventChart(eventCounts, eventSpecificResults) {
    const chartContainer = document.getElementById('event-chart');
    if (!chartContainer) return;

    const existingChart = echarts.getInstanceByDom(chartContainer);
    if (existingChart) existingChart.dispose();

    const eventChart = echarts.init(chartContainer);

    const eventData = Object.entries(eventCounts).map(([event, count]) => ({
        name: event || 'Unknown Event',
        value: count || 0,
        won: eventSpecificResults[event]?.won || 0,
        loss: eventSpecificResults[event]?.loss || 0,
        draw: eventSpecificResults[event]?.draw || 0,
        userResigned: eventSpecificResults[event]?.resignations?.user?.total || 0,
        opponentResigned: eventSpecificResults[event]?.resignations?.opponent?.total || 0,
        userTimeout: eventSpecificResults[event]?.timeouts?.user?.total || 0,
        opponentTimeout: eventSpecificResults[event]?.timeouts?.opponent?.total || 0
    }));

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                const { name, value, data } = params;
                return `${name}<br/>` +
                    `Total Games: ${value}<br/>` +
                    `Wins: ${data.won}<br/>` +
                    `Losses: ${data.loss}<br/>` +
                    `Draws: ${data.draw}<br/>` +
                    `User Resigned: ${data.userResigned}<br/>` +
                    `Opponent Resigned: ${data.opponentResigned}<br/>` +
                    `User Timeout: ${data.userTimeout}<br/>` +
                    `Opponent Timeout: ${data.opponentTimeout}`;
            }
        },
        series: [
            {
                name: 'Events',
                type: 'pie',
                radius: ['40%', '70%'],  // Makes it a donut chart
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 1
                },
                label: {
                    show: true,  // Ensure labels are always shown
                    position: 'outside',  // Place the labels outside the chart
                    formatter: '{b}: {c} ({d}%)',  // Customize the label text with name, value, 
                },
                emphasis: {
                    label: {
                        show: true,  // Show labels on hover
                        fontSize: '16',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: true
                },
                data: eventData
            }
        ]
    };

    eventChart.setOption(option);
}

function renderChart(results) {
    const chartDom = document.getElementById('chart-container');
    if (chartDom) {
        const myChart = echarts.init(chartDom);
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: function (params) {
                    const category = params[0].name;
                    let data;
                    if (category === 'Overview') {
                        data = {
                            total: results.total_games,
                            won: results.won,
                            loss: results.loss,
                            draw: results.draw,
                            userResigned: results.resignations.user.total,
                            opponentResigned: results.resignations.opponent.total,
                            userTimeout: results.timeouts.user.total,
                            opponentTimeout: results.timeouts.opponent.total
                        };
                    } else if (category === 'Played as White') {
                        data = {
                            total: results.white.won + results.white.loss + results.white.draw,
                            won: results.white.won,
                            loss: results.white.loss,
                            draw: results.white.draw,
                            userResigned: results.resignations.user.white,
                            opponentResigned: results.resignations.opponent.white,
                            userTimeout: results.timeouts.user.white,
                            opponentTimeout: results.timeouts.opponent.white
                        };
                    } else if (category === 'Played as Black') {
                        data = {
                            total: results.black.won + results.black.loss + results.black.draw,
                            won: results.black.won,
                            loss: results.black.loss,
                            draw: results.black.draw,
                            userResigned: results.resignations.user.black,
                            opponentResigned: results.resignations.opponent.black,
                            userTimeout: results.timeouts.user.black,
                            opponentTimeout: results.timeouts.opponent.black
                        };
                    }
                    return `Total Games: ${formatNumberWithCommas(data.total)}<br>
                            Wins: ${formatNumberWithCommas(data.won)}<br>
                            Losses: ${formatNumberWithCommas(data.loss)}<br>
                            Draws: ${formatNumberWithCommas(data.draw)}<br>
                            User Resigned: ${formatNumberWithCommas(data.userResigned)}<br>
                            Opponent Resigned: ${formatNumberWithCommas(data.opponentResigned)}<br>
                            User Timeout: ${formatNumberWithCommas(data.userTimeout)}<br>
                            Opponent Timeout: ${formatNumberWithCommas(data.opponentTimeout)}`;
                },
                textStyle: {
                    fontSize: 15,
                    fontFamily: 'Noto Sans, sans-serif',
                    color: '#09090b'
                },
                backgroundColor: '#fafafa',
                borderColor: '#e4e4e7',
                borderWidth: 1,
                borderRadius: 8,
                padding: 16
            },
            legend: {
                data: ['Wins', 'Losses', 'Draws'],
                left: 'left',
                top: 'top'
            },
            grid: {
                left: '3%',
                right: '3%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['Overview', 'Played as White', 'Played as Black']
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    name: 'Wins',
                    type: 'bar',
                    stack: 'Total',
                    label: {
                        show: true,
                        position: 'inside'
                    },
                    itemStyle: {
                        color: '#77DD77' // Green color for Won
                    },
                    data: [
                        results.won,
                        results.white.won,
                        results.black.won
                    ]
                },
                {
                    name: 'Losses',
                    type: 'bar',
                    stack: 'Total',
                    label: {
                        show: true,
                        position: 'inside'
                    },
                    itemStyle: {
                        color: '#FF6961' // Red color for Loss
                    },
                    data: [
                        results.loss,
                        results.white.loss,
                        results.black.loss
                    ]
                },
                {
                    name: 'Draws',
                    type: 'bar',
                    stack: 'Total',
                    label: {
                        show: true,
                        position: 'inside'
                    },
                    itemStyle: {
                        color: '#FFB347' // Yellow color for Draw
                    },
                    data: [
                        results.draw,
                        results.white.draw,
                        results.black.draw
                    ]
                }
            ]
        };
        myChart.setOption(option);
    }
}

function createRatingProgressChart(games, username) {
    // Define all possible game types and their colors
    const gameTypes = {
        'UltraBullet': '#FF4136',
        'Bullet': '#FF851B',
        'Blitz': '#FFDC00',
        'Rapid': '#2ECC40',
        'Classical': '#0074D9',
        'Correspondence': '#B10DC9',
        'Standard': '#01FF70',
        'Chess960': '#7FDBFF',
        'King of the Hill': '#F012BE',
        'Antichess': '#85144b',
        'Atomic': '#3D9970',
        'Three-check': '#39CCCC',
        'Horde': '#111111',
        'Racing Kings': '#AAAAAA',
        'Crazyhouse': '#8B4513'
    };

    // Initialize data structure for each game type
    const ratingsByType = {};

    games.forEach(game => {
        const date = game.headers.UTCDate;
        const time = game.headers.UTCTime;
        const event = game.headers.Event;

        // Skip if missing essential data
        if (!date || !time || !event) {
            return;
        }

        // Extract game type from event (e.g., "Rated blitz game" → "Blitz")
        const typeMatch = event.match(/Rated (.*?) game/);
        if (!typeMatch) return;

        const gameType = typeMatch[1];
        if (!gameType) return;

        const timestamp = new Date(`${date} ${time}`).getTime();

        // Get user's rating
        let rating;
        if (game.headers.White.toLowerCase() === username.toLowerCase()) {
            rating = parseInt(game.headers.WhiteElo);
        } else if (game.headers.Black.toLowerCase() === username.toLowerCase()) {
            rating = parseInt(game.headers.BlackElo);
        }

        if (rating) {
            if (!ratingsByType[gameType]) {
                ratingsByType[gameType] = [];
            }
            ratingsByType[gameType].push([timestamp, rating]);
        }
    });

    // Sort data points for each game type
    Object.keys(ratingsByType).forEach(type => {
        ratingsByType[type].sort((a, b) => a[0] - b[0]);
    });

    // Create series array for the chart
    const series = Object.keys(ratingsByType).map(type => ({
        name: type,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
            width: 2
        },
        itemStyle: {
            color: gameTypes[type] || '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color for undefined types
        },
        data: ratingsByType[type]
    }));

    const chart = echarts.init(document.getElementById('rating-progress-chart'));
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: function (params) {
                const date = new Date(params[0].value[0]);
                let result = `Date: ${date.toLocaleDateString()}<br/>`;
                params.forEach(param => {
                    result += `${param.seriesName}: ${param.value[1]}<br/>`;
                });
                return result;
            }
        },
        legend: {
            type: 'scroll',
            orient: 'horizontal',
            right: 0,
            top: 0,
            bottom: 0,
            selector: [
                {
                    type: 'all',
                    title: 'All'
                },
                {
                    type: 'inverse',
                    title: 'Inverse'
                }
            ]
        },
        grid: {
            left: '3%',
            right: '3%',
            bottom: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'time',
            boundaryGap: false,
            axisLine: { onZero: false }
        },
        yAxis: {
            type: 'value',
            name: 'Rating',
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed'
                }
            }
        },
        series: series,
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100
            },
            {
                show: true,
                type: 'slider',
                bottom: 10,
                start: 0,
                end: 100
            }
        ]
    };

    chart.setOption(option);

    // Handle window resize
    window.addEventListener('resize', () => {
        chart.resize();
    });
}

function formatTimeControl(timeControl) {
    if (timeControl === 'Unknown') return timeControl;

    // Return the original time control format
    return timeControl;
}

function createTimeControlChart(games) {
    const timeControls = {};

    games.forEach(game => {
        if (!game.headers.TimeControl || game.headers.TimeControl === '0+0') return;

        const timeControl = game.headers.TimeControl;
        if (!timeControls[timeControl]) {
            timeControls[timeControl] = {
                total: 0,
                won: 0,
                lost: 0,
                draw: 0,
                userResigned: 0,
                opponentResigned: 0,
                userTimeout: 0,
                opponentTimeout: 0
            };
        }

        const stats = timeControls[timeControl];
        const isUserWhite = game.headers.White === currentUsername;
        const isUserBlack = game.headers.Black === currentUsername;
        const result = game.headers.Result;
        const moves = game.headers.Moves || '';

        stats.total++;

        const isUserWin = (isUserWhite && result === '1-0') || (isUserBlack && result === '0-1');
        const isUserLoss = (isUserWhite && result === '0-1') || (isUserBlack && result === '1-0');
        const isUserDraw = result === '1/2-1/2';

        if (isUserWin) stats.won++;
        if (isUserLoss) stats.lost++;
        if (isUserDraw) stats.draw++;

        if (isUserWhite) {
            if (moves.includes('White resigns')) stats.userResigned++;
            if (moves.includes('Black resigns')) stats.opponentResigned++;
            if (moves.includes('Black wins on time')) stats.userTimeout++;
            if (moves.includes('White wins on time')) stats.opponentTimeout++;
        } else if (isUserBlack) {
            if (moves.includes('Black resigns')) stats.userResigned++;
            if (moves.includes('White resigns')) stats.opponentResigned++;
            if (moves.includes('White wins on time')) stats.userTimeout++;
            if (moves.includes('Black wins on time')) stats.opponentTimeout++;
        }
    });

    const pieData = Object.entries(timeControls)
        .filter(([timeControl, stats]) => timeControl !== '0+0' && stats.total > 0)
        .map(([timeControl, stats]) => ({
            name: timeControl,
            value: stats.total,
            stats: stats
        }));

    const chart = echarts.init(document.getElementById('time-control-chart'));
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                const stats = params.data.stats;
                return `${params.name}<br/>
                        Total Games: ${stats.total}<br/>
                        Wins: ${stats.won}<br/>
                        Losses: ${stats.lost}<br/>
                        Draws: ${stats.draw}<br/>
                        User Resigned: ${stats.userResigned}<br/>
                        Opponent Resigned: ${stats.opponentResigned}<br/>
                        User Timeout: ${stats.userTimeout}<br/>
                        Opponent Timeout: ${stats.opponentTimeout}`;
            }
        },
        series: [{
            type: 'pie',
            radius: '70%',
            data: pieData
        }]
    };

    chart.setOption(option);
}
