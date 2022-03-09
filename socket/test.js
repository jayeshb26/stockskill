playCasino = (gameName, position, result) => {
    let numMultiply = 36;
    for (const pos of position) {
        for (const num of pos[Object.keys(pos)[0]]) {
            numMultiply = pos[Object.keys(pos)[0]].length > 6 ? 36 : 35;

            let wonAmount =
                (pos.amount * numMultiply) / pos[Object.keys(pos)[0]].length;
            games[gameName].position = immutable.update(
                games[gameName].position,
                [num],
                (v) => (v ? v + wonAmount : wonAmount)
            );
            transactions[gameName] = immutable.update(
                transactions[gameName],
                [num, result],
                (v) => (v ? v + wonAmount : wonAmount)
            );
        }
    }
    console.log("This is data", games);
    console.log("This is the Dtata: ", games[gameName].position);
};