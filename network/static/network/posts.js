document.addEventListener('DOMContentLoaded', function() {

  document.querySelector('#new_post_field').style.display = 'none';
  document.querySelector('#new_post_button_field').style.display = 'block';
  document.querySelector('#post_list_field').style.display = 'block';

  // Click on new post button to open new post field
  document.querySelector('#new_post_button').addEventListener('click', function() {
    document.querySelector('#new_post_button_field').style.display = 'none';
    document.querySelector('#new_post_field').style.display = 'block';
  });

  // Click on all posts button to load all posts
  document.querySelector('#all_posts_button').addEventListener('click', function() {
    console.log('All posts button clicked');
    load_post_list('all');
  });

    // Click on following posts button to load following posts
    document.querySelector('#following').addEventListener('click', function() {
        console.log('Following posts button clicked');
        load_post_list('following');
    });

  load_post_list('all');

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
        document.querySelector('#new_post_button_field').style.display = 'block';
        document.querySelector('#new_post_field').style.display = 'none';
        document.querySelector('#compose-body').value = '';
        load_post_list('all');
    })
    .catch(error => {
        console.log('Error:', error);
    });
    
    return false;
  }
});

function load_profile(username) {
    fetch(`/profile/${username}`)
    .then(response => {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response.json();
    })
    .then(profile => {
        const profile_view = document.querySelector('#profile_field');

        profile_view.innerHTML = '';

        // Add profile to profile view
        let profileDiv = document.createElement('div');
        profileDiv.className = 'profile card';
        profileDiv.innerHTML = `
            <div class="profile-header">
                <div class="profile-header-left">
                    <a class="author_name">${profile.username}</a>
                </div>
                <div class="profile-header-right">
                    <div class="profile-followers">${profile.followers} followers</div>
                    <div class="profile-following">${profile.following} following</div>
                </div>
            </div>
        `;
        profile_view.appendChild(profileDiv);
        profile_view.style.display = 'block';

        load_post_list('all');
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

function load_post_list(post_list) {
    fetch(`/posts/${post_list}`)
    .then(response => response.json())
    .then(posts => {
        const post_list_view = document.querySelector('#post_list_field');

        post_list_view.innerHTML = '';

        // Add posts to post list
        posts.forEach(post => {
            // Create shorter timestamp for easier reading
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
            post_list_view.appendChild(postDiv);

            // Add event listener to author name to load profile
            let authorNameElement = postDiv.querySelector('.author_name');
            authorNameElement.addEventListener('click', function() {
                load_profile(authorNameElement.innerHTML);
            });
        });
    })
}