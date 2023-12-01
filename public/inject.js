// Function to inject the icon
function injectIcon(commentBox) {
  try {
    if (!commentBox || commentBox.querySelector("#myExtensionIcon")) {
      return; // Exit if the commentBox is invalid or the icon already exists
    }
    // Only proceed if the comment box is found
    if (commentBox) {
      // Create the icon element
      const iconElement = document.createElement("img");
      iconElement.src = chrome.runtime.getURL("icons/comments.png");
      iconElement.style.cursor = "pointer";
      iconElement.id = "myExtensionIcon";
      iconElement.style.cursor = "pointer";
      iconElement.style.width = "20px";
      iconElement.style.height = "20px";
      iconElement.style.margin = "10px";

      // Append the icon to the comment box
      commentBox.appendChild(iconElement);

      // Function to create and show the popup
      function showPopup() {
        const popup = document.createElement("div");
        popup.id = "myExtensionPopup";
        popup.style.position = "absolute";
        popup.style.border = "1px solid #ccc";
        popup.style.backgroundColor = "#ffffff";
        popup.style.display = "flex";
        popup.style.flexDirection = "column";
        popup.style.padding = "10px";
        popup.style.borderRadius = "5px";
        popup.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
        popup.style.zIndex = "999999";
        const iconRect = iconElement.getBoundingClientRect();
        popup.style.top = `${iconRect.bottom + window.scrollY}px`;
        popup.style.left = `${iconRect.left + window.scrollX}px`;

        // Extract the content of the LinkedIn post
        const postContent = findLinkedInPostContent(commentBox);
        const tones = [
          "supportive",
          "critical",
          "informative",
          "curious",
          " enthusiastic",
        ];
        const toneDescriptions = {
          Happy: "Express a positive and cheerful sentiment.",
          Sad: "Show empathy or sadness.",
          Angry: "Convey frustration or disagreement.",
          Appreciative: "Show gratitude or appreciation.",
          Curious: "Ask a question or express curiosity.",
        };
        tones.forEach((tone) => {
          const toneButton = document.createElement("button");
          toneButton.textContent = tone;
          toneButton.setAttribute("title", toneDescriptions[tone]);
          toneButton.style.padding = "5px";
          toneButton.style.width = "100%";
          toneButton.addEventListener("mouseover", function () {
            this.style.backgroundColor = "#e0e0e0"; // Example hover color
          });

          toneButton.addEventListener("mouseout", function () {
            this.style.backgroundColor = ""; // Revert to original style
          });

          // Click event for tone buttons
          toneButton.addEventListener("click", function () {
            fetchOpenAiSuggestion(postContent, tone.toLowerCase())
              .then((suggestedCommentText) => {
                chrome.storage.local.get("activeCommentBoxId", function (data) {
                  const commentBoxId = data.activeCommentBoxId;
                  const commentBox = document.getElementById(commentBoxId);
                  if (commentBox) {
                    const suggestedComment =
                      commentBox.querySelector(".ql-editor");
                    suggestedComment.innerHTML = `<p>${suggestedCommentText}</p>`;
                    commentBox.classList.remove("ql-blank");
                    commentBox.dispatchEvent(
                      new InputEvent("input", { bubbles: true })
                    );
                  }
                  popup.style.display = "none";
                });
              })
              .catch((error) =>
                console.error("Error getting comment suggestion:", error)
              );
          });
          popup.appendChild(toneButton);
          document.body.appendChild(popup);
        });

        // Function to handle outside click
        function handleClickOutside(event) {
          if (popup && !popup.contains(event.target)) {
            popup.style.display = 'none';
            document.removeEventListener('click', handleClickOutside);
          }
        }

        // Delay adding the event listener to avoid immediate closing due to the same click event
        setTimeout(() => {
          document.addEventListener('click', handleClickOutside);
        }, 0);
      }

      iconElement.addEventListener("click", function (event) {
        showPopup(event.target);
        const commentBoxId = this.closest(
          ".comments-comment-box.comments-comment-box--has-avatar"
        ).getAttribute("id");

        chrome.storage.local.set({ activeCommentBoxId: commentBoxId });
      });
    } 7
  } catch (error) {
    console.error("Error in injectIcon function:", error);
  }
}

// Function to make the API request to OpenAI
async function fetchOpenAiSuggestion(postContent, tone) {
  const apiBaseUrl = "http://localhost:3000";
  const response = await fetch(`${apiBaseUrl}/api/openai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({ postContent, tone }),
  });
  if (!response.ok) {
    console.error(
      "server responded with non ok status!!!",
      response.status
    );
    return "Error getting comment suggestion from OpenAI!!!";
  }
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return "Error in parsing server response.";
  }
}

// To find LinkedIn Post content:
function findLinkedInPostContent(commentBoxNode) {
  const commonAncestorSelector =
    ".feed-shared-update-v2.feed-shared-update-v2--minimal-padding.full-height.relative.feed-shared-update-v2--e2e.artdeco-card";
  const likeCommonAncestorSeclector = ".feed-shared-update-v2.feed-shared-update-v2--minimal-padding.full-height.relative.artdeco-card"
  const commonAncestorSelector2 = ".feed-shared-update-v2.feed-shared-update-v2--minimal-padding.full-height.relative.artdeco-card";
  const postContentSelector =
    ".update-components-text.relative.update-components-update-v2__commentary";

  // Find the common ancestor element that contains the post content.
  const commonAncestor =
    commentBoxNode.closest(commonAncestorSelector) ||
    commentBoxNode.closest(likeCommonAncestorSeclector) ||
    commentBoxNode.closest(commonAncestorSelector2)
  if (!commonAncestor) {
    console.error("Unable to find the common ancestor element.");
    return null;
  }

  // Now find the post content element within the common ancestor.
  const postContentElement = commonAncestor.querySelector(postContentSelector);
  if (!postContentElement) {
    console.error("Unable to find the post content element.");
    return "Oops, Somthing went wrong!!!";
  }
  // Find the 'span' with class 'break-words'
  const breakdownSpan = postContentElement.querySelector(".break-words");
  if (!breakdownSpan) {
    console.error("Breakdown span not found.");
    return "Oops, Somthing went wrong!!!";
  }
  // Then, find the innermost 'span' with 'dir="ltr"' within 'breakdownSpan'
  const targetSpan = breakdownSpan.querySelector('span span[dir="ltr"]');
  if (!targetSpan) {
    console.error('Target span with dir="ltr" not found.');
    return "Oops, Somthing went wrong!!!";
  }
  // Check if the targetSpan has non-null textContent
  if (targetSpan.textContent === null || targetSpan.textContent === undefined) {
    console.error("Target span textContent is null or undefined.");
    return "Oops, Somthing went wrong!!!";
  }

  // Return the trimmed text content
  return targetSpan.textContent ? targetSpan.textContent.trim() : "";
}

// Use MutationObserver to monitor dynamically added comment boxes
const observer = new MutationObserver(function (mutations) {
  try {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(function (node) {
          if (node.matches && node.matches(".display-flex.mlA")) {
            injectIcon(node);
          } else if (node.querySelectorAll) {
            const commentBoxes = node.querySelectorAll(".display-flex.mlA");
            commentBoxes.forEach(injectIcon);
          }
        });
      }
    });
  } catch (error) {
    console.error("Error in MutationObserver:", error);
  }
});

// Start observing the document body for added nodes
observer.observe(document.body, { childList: true, subtree: true });

function handleDynamicLoading() {
  try {
    setInterval(() => {
      if (!document.getElementById("myExtensionIcon")) {
        injectIcon();
      }
    }, 1000);
  } catch (error) {
    console.error("Error in handleDynamicLoading:", error);
  }
}

// Call the function to start the process
handleDynamicLoading();
