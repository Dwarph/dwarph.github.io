function movementListener() {

    /*
     * KEYCODES:
     * 32: space
     * 65: a
     * 66: d
     * 87: w
     * 88: s
     * 81: q
     * 69: e
     */

    //check for keydown
    document.addEventListener('keydown', function (event) {

        switch (event.keyCode) {
            case 32:
                spaceKeyDown = true;
                break;
            case 65:
                leftKeyDown = true;
                break;
            case 68:
                rightKeyDown = true;
                break;
            case 87:
                forwardKeyDown = true;
                break;
            case 83:
                backwardKeyDown = true;
                break;
            case 81:
                upKeyDown = true;
                break;
            case 69:
                downKeyDown = true;
                break;
        }
    });

    //check for keyup
    document.addEventListener('keyup', function (event) {
        switch (event.keyCode) {
            case 32:
                spaceKeyDown = false;
                break;
            case 65:
                leftKeyDown = false;
                break;
            case 68:
                rightKeyDown = false;
                break;
            case 87:
                forwardKeyDown = false;
                break;
            case 83:
                backwardKeyDown = false;
                break;
            case 81:
                upKeyDown = false;
                break;
            case 69:
                downKeyDown = false;
                break;
        }
    });

}