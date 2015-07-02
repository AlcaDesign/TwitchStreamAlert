# TwitchStreamAlert
A basic Chrome desktop notification extension.

#### Installion

1. Clone the repository to your local file system.

```
$ clone https://github.com/AlcaDesign/TwitchStreamAlert
```

2. Go to ```chrome://extensions/``` in Chrome and make sure to check **"Developer mode"** in the top right-hand corner of this page.

	* Unpacked installion *(for testing)*

		1. Click **"Load unpacked extension..."** in the top left-hand corner.
		2. Locate the folder where you cloned *TwitchStreamAlert*.

	* Pack and install

		1. Click **"Pack extension..."** in the top left-hand corner.
		2. Next to the **"Extension root directory"** input, click **"Browse"** and locate the folder where you cloned *TwitchStreamAlert*.
			* ***Note**: You only need to supply the private key file after the first packing or delete the aforementioned ```.pem``` file for additonal packings.*
		3. Click **"Pack Extension"** to finish the extension. This puts a ```.crx``` (chrome extension) and a ```.pem``` (private key) file in the parent directory.
		4. Locate the ```.crx``` file and then click-and-drag it onto the *extensions* page.
		5. Click **"Add"** to allow the extension the necessary persmissions and to be installed.

3. Adjust the options for the extension.