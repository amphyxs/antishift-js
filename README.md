# antishift-js

## ℹ️ What is antishift-js?

Antishift.js is a lightweight JavaScript library that prevents layout shifts which move interactive elements (buttons, links, divs, etc.) away from your cursor. No more missed clicks due to elements jumping around

## 📋 MVP TODO

- [x] Case: Movement via CSS changes
- [ ] Case: Movement due to container displacement (resize or pushing)
- [x] Case: Movement due to adjacent DOM element pushing (CSS changes or DOM appearance)
- [ ] Case: Movement due to element removal from DOM (display none or actual DOM removal)
- [ ] Overlapping elements case
- [ ] Publish npm library
- [x] Create README
- [x] License
- [ ] Library distribution

## 🗺️ Roadmap

- [ ] Define an area around cursor for protection
- [ ] Auto and manual modes for different use cases
- [ ] Specify tags to ignore in auto mode
- [ ] Configure anti-shift timeout duration
- [ ] Monitor and report library performance impact

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
