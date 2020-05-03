const socket = io();

// elements
const $form = document.querySelector('form');
const $messageFormInput = $form.querySelector('input');
const $messageFormBtn = $form.querySelector('button');
const $sendLocationBtn = document.querySelector("#send-location-btn");
const $messages = document.querySelector('#messages');

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    //new msg
    const $newMsg = $messages.lastElementChild

    //  height of last msg
    const newMsgStyles = getComputedStyle($newMsg)
    const newMsgMargin = parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = $newMsg.offsetHeight + newMsgMargin;

    //visible height
    const visibleHeight =  $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight;

    //how far i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMsgHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    // console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on("locationMessage", (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('HH:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html
})

$form.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormBtn.setAttribute('disabled', 'disabled')
    const msg = e.target.elements.message.value;

    socket.emit('sendMsg', msg, (errorMessage) => {
        $messageFormBtn.removeAttribute('disabled');
        $messageFormInput.value = ''
        $messageFormInput.focus();

        if (errorMessage) {
            return console.log(errorMessage)
        }
        console.log('message delivered')
    })
})

$sendLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert('geolocation not supported in your browser')
    }
    $sendLocationBtn.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('location shared')
            $sendLocationBtn.removeAttribute('disabled')
        })
    })

})


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/'
    }
})



