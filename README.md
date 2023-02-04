# control-center

A web application used to manage puzzles within an escape room.
View the [live version](https://muddescapes.github.io/control-center/).

Automatically deploys to GitHub Pages on push to main. Built using NextJS and
Tailwind.

## How does it work?

The control center communicates with the ESP-32s via MQTT. MQTT is a lightweight
publish-subscribe protocol that is commonly used for IoT applications. Devices
can publish messages to topics, and other devices can subscribe to those topics
to receive messages.

The topics are structured as follows:

- `muddescapes/` - root topic
  - `data/` - communication from ESP-32 to control center
    - `<puzzle name>/` - topic for a specific puzzle
      - `<variable>` - variable state changes
  - `control/` - communication from control center to ESP-32
    - `<puzzle name>/` - topic for a specific puzzle

1. Upon first connecting, the control center sends a message to `muddescapes/`.
   The ESP-32s will respond with their current state, which includes their
   available functions and current variable states.
2. Available states are sent to `muddescapes/data/<puzzle name>`.
   - Format: `functions:<function1>,<function2>,...`
3. Variable state changes are sent to
   `muddescapes/data/<puzzle name>/<variable name>`.
   - Format: 1 for true, 0 for false
   - Note: only boolean variables are supported.
4. To call a function, the control center sends a message to
   `muddescapes/control/<puzzle name>`.
   - Format: `<function name>`
5. When the ESP-32 executes a function, it will send a message to
   `muddescapes/data/<puzzle name>`.
   - Format: `<function name>`
   - This allows the control center to update the UI to reflect that the
     function was successfully executed.

## How do I add a new puzzle?

See [libmuddescapes](https://github.com/muddescapes/libmuddescapes) for the
PlatformIO library used on the ESP-32 side.

## Example

![Example](https://i.imgur.com/kUCC7is.png)
