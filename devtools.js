/*
 * Chromnibug
 * Intermediary between eventPage and devTools panel
 * used for message passing only
 */
( function() {

    /**
     * Callback for panelCreated event
     */
    var panelCreated = function( panel ) {
        var queuedMessages = [],
            panelWindow,  // reference to devtools_panel.html's `window` object
            clearButton,
            port;

        port = chrome.extension.connect( { name: "chromnibug-" + chrome.devtools.inspectedWindow.tabId } );

        /**
         * Receieves messages from the eventPage
         */
        port.onMessage.addListener( function( msg ) {
            if( panelWindow ) {
                panelWindow.Chromnibug.receive_message( msg );
            } else {
                queuedMessages.push( msg );
            }
        } );

        /**
         * Called when the devtools panel is first shown
         */
        panel.onShown.addListener( function tmp( _window ) {
            panel.onShown.removeListener( tmp ); // Run once only
            panelWindow = _window;

            // Release queued messages
            var msg;
            while( msg = queuedMessages.shift() )  {
                panelWindow.Chromnibug.receive_message( msg );
            }

            // Inject a reply mechanism into the caller
            panelWindow.Chromnibug.send_message = function( msg ) {
                port.postMessage( msg );
            };
        } );


        // add a clear button
        clearBtn = panel.createStatusBarButton( "foo.png", "Clear events.", false );
        clearBtn.onClicked.addListener( function() {
            var tables = panelWindow.document.getElementsByTagName( "table" );
            while( tables.length > 0 ) {
                for( i=0; i<tables.length; ++i ) {
                    if( tables[i].className.match( /req/ ) ) {
                        tables[i].parentNode.removeChild( tables[i] );
                    }
                }
                tables = panelWindow.document.getElementsByTagName( "table" );
            }
        } );
    }


    /**
     * Create the panel
     */
    chrome.devtools.panels.create( "Chromnibug",
                                   "icon.png",
                                   "devtools_panel.html",
                                   panelCreated
                                 );

    // public
    return {};

}() );
