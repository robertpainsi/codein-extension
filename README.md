## Chrome Extension for Google Code-In

This plugin will highlight Google Code-In tasks which needs attention at https://codein.withgoogle.com/dashboard/task-instances/in-progress/.

![Example image](https://raw.githubusercontent.com/robertpainsi/codein-extension/master/example.png)

It will change the tasks

* ![#e53935](https://placehold.it/15/e53935/000000?text=+) Color to red if
  * The Student is waiting for more than 12 hours for a review.
  * The Student asked a question.
* ![#9ccc00](https://placehold.it/15/9ccc00/000000?text=+) Color to green if
  * The last activity was by a Mentor and therefore the task is handled. Beware, sometimes this will give you a false-positive if the Mentor commented that he can't help. The Mentor should always seek for help on Slack, IRC, Google Groups then.
* ![#2894ed](https://placehold.it/15/2894ed/000000?text=+) Color to blue if
  * The Student is running out of time (less than 6 hours) and the clock is still ticking.
* ![#ffcca4](https://placehold.it/15/ffcca4/000000?text=+) Transparency to 50%
  * If there is no activity on the task yet.

Tasks waiting for a review will have the default color ![#ff8f00](https://placehold.it/15/ff8f00/000000?text=+)

### HOW TO INSTALL

1. Download the latest version at https://github.com/robertpainsi/codein-extension/archive/master.zip
2. Extract the zip file to a folder where you want to permanently store the chrome extension.
3. Go to [chrome://extensions/](chrome://extensions/)
4. Click on _Load unpacked extension_ and open the folder.
   * If you can't find the button on the top of the page, make sure that _Developer mode_ is enabled (https://developer.chrome.com/extensions/faq#faq-dev-01)
5. To test it, go to https://codein.withgoogle.com/dashboard/task-instances/in-progress/
