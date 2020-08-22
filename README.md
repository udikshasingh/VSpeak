
## Dependency Installation

Following command can be used for dependency installation:

npm install

## System Architecture

VSpeak is a VS Code extension that provides voice-based control of the IDE to the user.

Once the extension is loaded, user can give speech commands to the focused editor window. For the speech to text conversion, Google Cloud Speech to Text API is used.

The command interpretation process is an amalgamation of identifying commands on both python and javascript end.

  * In the first phase, a command is interpreted from the generated text using the command dictionary on the python end.
  * In the second phase, results from python’s interpreter are then mapped to the extension’s VS Code API functions on the javascript end.

After successful recognition of speech and interpretation, it is either executed, or there is a fall back to a failure scenario where no command is identified and the speech gets ignored. The result of the recognition is displayed on the editor’s status bar.


