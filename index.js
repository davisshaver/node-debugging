function hardToDebugPromise() {
    return Promise.all(
        [1, 2, 3].map(
            (count) => {
                return new Promise((resolve, reject) => {
                    const random = Math.random();
                    if (0.10 > random) {
                        reject('RANDOM ERROR');
                    } else {
                        resolve('Success');
                    }
                });
            }
        )
    )
}

hardToDebugPromise()
    .then(
        (value) => console.log(value)
    )
    .catch(
        (error) => console.log(error)
    );