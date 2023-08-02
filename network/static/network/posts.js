let logged_in_username = "";

document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_logged_in_username')
    .then(response => response.json())
    .then(user => {
        logged_in_username = user.username;
        set_up_initial_view();
        top_header.innerHTML = 'All Posts';
        load_post_list('all');
    })
});

// Set up initial view
function set_up_initial_view() {

    new_post_field = document.querySelector('#new_post_field')
    post_list_field = document.querySelector('#post_list_field')
    profile_field = document.querySelector('#profile_field')
    top_header = document.querySelector('#top_header')

    new_post_field.style.display = 'none';
    post_list_field.style.display = 'block';
    profile_field.style.display = 'none';

    // all posts button
    document.querySelector('#all_posts_button').addEventListener('click', function() {
        new_post_field.style.display = 'none';
        post_list_field.style.display = 'block';
        profile_field.style.display = 'none';

        top_header.innerHTML = 'All Posts';
        load_post_list('all');
    });

    // These should only be visible if logged in
    if (logged_in_username) {

        // new post link
        document.querySelector('#new_post').addEventListener('click', function() {
            new_post_field.style.display = 'block';
            post_list_field.style.display = 'block';
            profile_field.style.display = 'none';
            top_header.innerHTML = 'New Post';
        });

        // following posts link
        document.querySelector('#following').addEventListener('click', function() {
            new_post_field.style.display = 'none';
            post_list_field.style.display = 'block';
            profile_field.style.display = 'none';
    
            top_header.innerHTML = 'Following';
            load_post_list('following');
        });

        // my profile link
        document.querySelector('#my_profile').addEventListener('click', function() {
            new_post_field.style.display = 'none';
            post_list_field.style.display = 'block';
            profile_field.style.display = 'block';
    
            top_header.innerHTML = `${logged_in_username}`;
            load_profile(logged_in_username);
        });
    };

    // compose form
    document.querySelector('#compose-form').onsubmit = function() {
        const body = document.querySelector('#compose-body').value;

        fetch('/compose', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            body: body
        })
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(data => {
        if (data.status === 201) {
            showMessage(data.body.message, 'message_green');
        } else {
            showMessage(data.body.error, 'message_red');
        }
        })
        .then(() => {
            post_list_field.style.display = 'block';
            profile_field.style.display = 'none';
            new_post_field.style.display = 'none';
            document.querySelector('#compose-body').value = '';
            load_post_list('all');
        })
        .catch(error => {
            console.log('Error:', error);
        });
        
        return false;
    }
}

function load_profile(username) {
    fetch(`/profile/${username}`)
    .then(response => {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response.json();
    })
    .then(profile => {
        // create and clear profile view
        const profile_view = document.querySelector('#profile_field');
        profile_view.innerHTML = '';

        // Add profile to profile view
        let profileDiv = document.createElement('div');
        profileDiv.className = 'profile card';

        // Add profile info
        profileDiv.innerHTML = `
            <div>
                <div class="profile-followers" id="profile-followers">${profile.followers.length} follower(s)</div>
                <div class="profile-following">following ${profile.following} </div>
            </div>
        `;
        profile_view.appendChild(profileDiv);

        // Add follow/unfollow button if not viewing own profile
        if (logged_in_username !== username && logged_in_username) {
            // create follow/unfollow button
            let followButton = document.createElement('button');
            followButton.className = 'follow-button';
            // If logged in user is not following this user
            if (!profile.followers.includes(logged_in_username)) {
                followButton.innerHTML = 'Follow';
            };
            // If logged in user is following this user
            if (profile.followers.includes(logged_in_username)) {
                followButton.innerHTML = 'Unfollow';
            };
            followButton.addEventListener('click', function() {
                fetch(`/follow/${username}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username
                    })
                })
                .then(response => response.json().then(data => ({ status: response.status, body: data })))
                .then(data => {
                    if (data.status === 200) {
                        showMessage(data.body.message, 'message_green');
                    } else {
                        showMessage(data.body.error, 'message_red');
                    }
                })
                .then(() => {
                    load_profile(username);
                })
                .catch(error => {
                    console.log('Error:', error);
                });
            });
            profileDiv.appendChild(followButton);
        }

        top_header.innerHTML = `${username}`;

        // Load this user's posts
        load_post_list(username);
    })
};

function showMessage(message, class_name) {
    const messageDiv = document.querySelector('#message');
    messageDiv.innerText = message;
    messageDiv.className = `message ${class_name}`;

    setTimeout(() => {
        messageDiv.innerText = '';
    }, 5000);
};

function like_post(post_id) {
    fetch(`/like_post/${post_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            post_id: post_id
        })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(data => {
        if (data.status === 200) {
            showMessage(data.body.message, 'message_green');
        } else {
            showMessage(data.body.error, 'message_red');
        }
    })
    .then(() => {
        load_post_list('all');
    })
    .catch(error => {
        console.log('Error:', error);
    });
};



function load_post_list(post_list, page=1) {
    fetch(`/posts/${post_list}?page=${page}`)
    .then(response => {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response.json();
    })
    .then(posts => {
        const post_list_field = document.querySelector('#post_list_field');

        post_list_field.innerHTML = '';

        // Add posts to post list
        posts.posts.forEach(post => {
            // Create shorter timestamp for easier readings
            let date = new Date(post.timestamp);
            let month = (date.getMonth() + 1).toString().padStart(2, '0');
            let day = date.getDate().toString().padStart(2, '0');
            let hours = date.getHours().toString().padStart(2, '0');
            let minutes = date.getMinutes().toString().padStart(2, '0');
            
            post.timestamp = `${month}/${day} ${hours}:${minutes}`;

            let postDiv = document.createElement('div');
            postDiv.className = 'post card';
            postDiv.innerHTML = `
                <div class="post-header">
                    <div class="post-header-left">
                        <a class="author_name">${post.author}</a>
                    </div>
                    <div class="post-header-right">
                        <div class="post-time">${post.timestamp}</div>
                    </div>
                </div>
                <div class="post-body">
                    ${post.body}
                </div>
                <div class="post-footer">
                    <div class="post-footer-left">
                        <button class="like-button" onclick="like_post(${post.id})">Like</button>
                        <button class="unlike-button" onclick="unlike_post(${post.id})">Unlike</button>
                    </div>
                    <div class="post-footer-right">
                        <div class="post-likes">${post.likes} likes</div>
                    </div>
                </div>
            `;
            post_list_field.appendChild(postDiv);

            // Add event listener to author name to load profile
            let authorNameElement = postDiv.querySelector('.author_name');
            authorNameElement.addEventListener('click', function() {            
                new_post_field.style.display = 'none';
                post_list_field.style.display = 'block';
                profile_field.style.display = 'block';
                load_profile(authorNameElement.innerHTML);
            });
        });

        // Add pagination buttons
        let paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';

        // Create the previous page button
        if (posts.has_previous) {
            let prevPageButton = document.createElement('button');
            prevPageButton.textContent = "Previous";
            prevPageButton.addEventListener('click', () => load_post_list(post_list, posts.previous_page_number));
            paginationDiv.appendChild(prevPageButton);
        }

        // Create the page number div
        let pageNumberDiv = document.createElement('div');
        pageNumberDiv.innerHTML = `Page ${posts.page_number} of ${posts.num_pages}`;
        paginationDiv.appendChild(pageNumberDiv);

        // Create the next page button
        if (posts.has_next) {
            let nextPageButton = document.createElement('button');
            nextPageButton.textContent = "Next";
            nextPageButton.addEventListener('click', () => load_post_list(post_list, posts.next_page_number));
            paginationDiv.appendChild(nextPageButton);
        }

        post_list_field.appendChild(paginationDiv);

    })
    .catch(error => {
        console.log('Error:', error);
    });
};