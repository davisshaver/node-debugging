Node debugging for fun and profit!

Take a look at `index.js` to start. There's a hard to debug function in there; a `Promise.all()` that will fail about 10% of the time.

Try running it a few times in your terminal.

```
zsh$ repeat 5 { node index.js }
[ 'Success', 'Success', 'Success' ]
[ 'Success', 'Success', 'Success' ]
RANDOM ERROR
RANDOM ERROR
[ 'Success', 'Success', 'Success' ]
```

Due to the way `Promise.all()` works, we don't know exactly which Promise was rejected – it could be the first, third, or second, and in a production enironment these might each represent a discrete and different task.

Let's say we wanted to understand the behavior more closely. We could jump into the Node debugger to identify which of the Promises had failed.

```
zsh$ node debug index.js
< Debugger listening on 127.0.0.1:5858
connecting to 127.0.0.1:5858 ... ok
break in index.js:18
 16 }
 17
>18 hardToDebugPromise()
 19     .then(
 20         (value) => console.log(value)
debug>
```

Here we stand at the precipice! Let me explain a few things before we dive in.

By default, the node debugger will break on the entry point, which is why it stopped at the `hardToDebugPromise()` call.

When debugging Node (or PHP for that matter), you have two basic actions available: step over (next) and step into. 

Let's use `s` to step into our Promise.

```
debug> s
break in index.js:2
  1 function hardToDebugPromise() {
> 2     return Promise.all(
  3         [1, 2, 3].map(
  4             (count) => {
debug>
```

Right now we're looking at the `Promise.all()`. This is like a choose your own adventure book, see what happens if I step _over_ this line. We step on the express bus right out of Promisetown.

```
debug> next
break in index.js:16
 14         )
 15     )
>16 }
 17
 18 hardToDebugPromise()
debug>
```

This time, see what happens if I step _into_ this line.

```
debug> s
break in index.js:5
  3         [1, 2, 3].map(
  4             (count) => {
> 5                 return new Promise((resolve, reject) => {
  6                     const random = Math.random();
  7                     if (0.10 > random) {
debug>
```

What can we do inside the function? Besides `s` and `next`?

How about `repl`? This is the Read Eval Print Loop interactive shell. Kinda like your console. Check out the output of `count`.

```
debug> repl
Press Ctrl + C to leave debug repl
> count
1
>
```

Those are the basic tools of Node debugging. Now to solve our bug. We need to identify why this fails. Let's exit the interactive shell and step into our first Promise.

```
debug> s
break in index.js:6
  4             (count) => {
  5                 return new Promise((resolve, reject) => {
> 6                     const random = Math.random();
  7                     if (0.10 > random) {
  8                         reject('RANDOM ERROR');
debug>
```

So we can see that the Promise rejects if `random` is less than 0.10. What's the value of `random` right now? Trick question, this line hasn't been evaluated yet. `s` once more and then try. Now you should see a value output.

```
debug> s
break in index.js:7
  5                 return new Promise((resolve, reject) => {
  6                     const random = Math.random();
> 7                     if (0.10 > random) {
  8                         reject('RANDOM ERROR');
  9                     } else {
debug> repl
Press Ctrl + C to leave debug repl
> random
0.46241828133547513
>
```

Now, try the same for `count`. What happens? Why?

```
> count
ReferenceError: count is not defined
>
```

`repl` does not access outer scopes, so on this line it cannot see the value of `count`. Let's grab something a little more powerful.

Make sure you've got `node-debug` installed with `npm install -g node-debug`. Now open Chrome and go to `chrome://inspect`, then click `Open dedicated DevTools for Node`.

Now back in your terminal, let's start a new debugging session:

```
node --inspect --debug-brk index.js
```

A familiar looking DevTools window should pop up.

<img width="1280" alt="screen shot 2017-06-28 at 12 32 31 pm" src="https://user-images.githubusercontent.com/1636964/27648948-36adcaa4-5bfe-11e7-81a5-62e44ea45c06.png">

These buttons are the step over, step into, and step out actions I described earlier.

<img width="227" alt="screen shot 2017-06-28 at 12 38 53 pm" src="https://user-images.githubusercontent.com/1636964/27649108-c81d3bdc-5bfe-11e7-9b1f-cbcbe593d123.png">

Let's step into the function until we reach line 7.

The Chrome debugger won't show the variable in local scope either, but you can navigate the call stack to examine different scopes.

![debug](https://user-images.githubusercontent.com/1636964/27649656-6a45088a-5c00-11e7-817d-f588585928f7.gif)

Some IDE's also support Node debugging. I personally use Visual Studio Code. Here's a configuration that should _just work_ for most Node scripts similar to the example file.

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "attach",
            "name": "Attach debugger",
            "port": 9229,
            "protocol": "inspector"
        }
    ]
}
```

Here's what the debugging interface looks like.

<img width="1280" alt="screen shot 2017-06-28 at 12 59 38 pm" src="https://user-images.githubusercontent.com/1636964/27650087-dcea434a-5c01-11e7-8d5e-642ddee10b80.png">
