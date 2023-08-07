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
            // change view
            new_post_field.style.display = 'block';
            post_list_field.style.display = 'block';
            profile_field.style.display = 'none';
            // change top header
            top_header.innerHTML = 'New Post';
            // enable the form to post a new post
            document.querySelector('#compose-form').onsubmit = function() {
                const body = document.querySelector('#compose-body').value;
                compose_post(body);
                return false;
            }
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
}

// Post a new post
function compose_post(body) {
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
}

// Like a post
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

// Edit a post
function edit_post(postId, body) {
    fetch(`/edit_post/${postId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            body: body
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
        post_list_field.style.display = 'block';
        profile_field.style.display = 'none';
        new_post_field.style.display = 'none';
        load_post_list('all');
    })
    .catch(error => {
        console.log('Error:', error);
    });
}

// Load a user's profile
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
            followButton.className = 'follow-button btn';
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

        // Make this page the page for the profile
        top_header.innerHTML = `${username}`;
        load_post_list(username);
    })
};

// Show a message for 5 seconds
function showMessage(message, class_name) {
    const messageDiv = document.querySelector('#message');
    messageDiv.innerText = message;
    messageDiv.className = `message ${class_name}`;

    setTimeout(() => {
        messageDiv.innerText = '';
    }, 5000);
};

// Like a post
function like_post(post_id, post_list, page_number) {
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
    .catch(error => {
        console.log('Error:', error);
    });
};

// Load a post list
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
        const pagination_field = document.querySelector('#pagination_field');

        post_list_field.innerHTML = '';
        pagination_field.innerHTML = '';

        // Add posts to post list
        posts.posts.forEach(post => {
            // Create shorter timestamp for easier readings
            let date = new Date(post.timestamp);
            let month = (date.getMonth() + 1).toString().padStart(2, '0');
            let day = date.getDate().toString().padStart(2, '0');
            let hours = date.getHours().toString().padStart(2, '0');
            let minutes = date.getMinutes().toString().padStart(2, '0');
            
            post.timestamp = `${month}/${day} ${hours}:${minutes}`;

            fetch(`/users_who_liked_post/${post.id}/`)
                .then(response => response.json())
                .then(users => {
                    post.likes_by = users;

                    // Add post to post list
                    let postDiv = document.createElement('div');
                    postDiv.className = 'post card';
                    postDiv.innerHTML = `
                        <div class="post-header">
                            <div class="post-time">${post.timestamp}</div>
                            <a class="author_name">${post.author}</a>
                        </div>
                        <div class="post-body">
                            ${post.body}
                        </div>
                        <div class="post-footer">
                            <div id="like-count-${post.id}" class="post-likes">${post.likes_by.length} likes</div>
                            <div class="post-button-field"></div>
                        </div>
                    `;

                    // Add like button if logged in
                    if (logged_in_username && logged_in_username !== post.author) {
                        // create like button
                        let likeButton = document.createElement('button');
                        likeButton.className = 'like-button button';
                        likeButton.id = `like-button-${post.id}`;
                        // If logged in user has not liked this post
                        if (!post.likes_by.includes(logged_in_username)) {
                            likeButton.innerHTML = 'Like';
                        };
                        // If logged in user has liked this post
                        if (post.likes_by.includes(logged_in_username)) {
                            likeButton.innerHTML = 'Unlike';
                        };
                        likeButton.addEventListener('click', function() {
                            like_post(post.id, post_list, posts.page_number);
                            const likeCountElement = document.querySelector(`#like-count-${post.id}`);
                            // Update the like count
                            if (likeButton.innerHTML === 'Like') {
                                post.likes_by.push(logged_in_username); // Add the user to the likes array
                                likeButton.innerHTML = 'Unlike'; // Update the button text
                            } else {
                                const index = post.likes_by.indexOf(logged_in_username);
                                if (index > -1) post.likes_by.splice(index, 1); // Remove the user from the likes array
                                likeButton.innerHTML = 'Like'; // Update the button text
                            }
                            // Update the like count display
                            likeCountElement.innerHTML = `${post.likes_by.length} likes`;
                        });
                        postDiv.querySelector('.post-button-field').appendChild(likeButton);
                    }

                    // Add edit button if logged in user is author of post
                    else if (logged_in_username === post.author) {
                        // create edit button
                        let editButton = document.createElement('button');
                        editButton.className = 'edit-button button';
                        editButton.innerHTML = 'Edit';
                        editButton.addEventListener('click', function() {
                            // populate compose form with post body
                            document.querySelector('#compose-body').value = post.body;
                            // enable the form to edit the post
                            document.querySelector('#compose-form').onsubmit = function() {
                                const body = document.querySelector('#compose-body').value;
                                edit_post(post.id, body);
                                return false;
                            }
                            // change top header
                            top_header.innerHTML = 'Edit Post';
                            // change view
                            new_post_field.style.display = 'block';
                            post_list_field.style.display = 'block';
                            profile_field.style.display = 'none';
                        });
                        postDiv.querySelector('.post-button-field').appendChild(editButton);
                    }

                    post_list_field.appendChild(postDiv);

                    // Add event listener to author name to load profile
                    let authorNameElement = postDiv.querySelector('.author_name');
                    authorNameElement.addEventListener('click', function() {            
                        new_post_field.style.display = 'none';
                        post_list_field.style.display = 'block';
                        profile_field.style.display = 'block';
                        load_profile(authorNameElement.innerHTML);
                    });
                })
                .catch(error => {
                    console.log('Error:', error);
                });
        })

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

        pagination_field.appendChild(paginationDiv);

    })
    .catch(error => {
        console.log('Error:', error);
    });
};