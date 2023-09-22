// Canvas UI element identifiers //
var sgGradingContainers = [
  ".rubric_container.for_grading",
  ".rubric_container.assessing",
];
var sgSummaryContainers = [".rubric_container.rubric_summary"];
var sgDescriptionSpanSelectors =
  sgGradingContainers
    .map(function (m) {
      return m + " span.description_title," + m + " div.description span";
    })
    .join(",") +
  "," +
  sgSummaryContainers
    .map(function (m) {
      return m + " div.description span";
    })
    .join(",");

// SEB integrations//
if (
  /courses\/\d+\/quizzes/g.test(window.location.href) &&
  $('*:contains("[SEB]")').length !== 0
) {
  if (
    navigator.userAgent.substring(
      navigator.userAgent.indexOf("key=") + 4,
      navigator.userAgent.indexOf(" SEB")
    ) === $("#SEB-data").data("value")
  ) {
    $("#header").remove();
    $("#left-side").remove();
    $("div.ic-app-nav-toggle-and-crumbs.no-print").remove();
    $("body:not(.no-headers).primary-nav-expanded .ic-Layout-wrapper").css(
      "margin-left",
      "0px"
    );
    $(
      "body.course-menu-expanded:not(.ic-no-flex-layout):not(.embedded):not(.is-inside-submission-frame) .ic-Layout-columns"
    ).css("margin-left", "0px");
    $("body:not(.no-headers).primary-nav-expanded .ic-Layout-wrapper").css(
      "max-width",
      "100%"
    );
    $("#SEB-instructions").remove();

    observerCompletedDictionary = {};

    // select the target node
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // remove extra buttons
        if ($('div[id^="mceu"]').length) {
          $('div[.mce-widge][aria-label="Insert/edit media"]').remove();
          $('div[.mce-widge][aria-label="Link to URL"]').remove();
          $('div[.mce-widge][aria-label="Remove link"]').remove();
          $('div[.mce-widge][aria-label="Embed image"]').remove();
          //$('div[.mce-widge][aria-label="Insert Math Equation"]').remove()
          $('div[.mce-widge][aria-label="YouTube"]').remove();
          $('div[.mce-widge][aria-label="Vimeo"]').remove();
          $('div[.mce-widge][aria-label="Khan Academy"]').remove();
          $('div[.mce-widge][aria-label="Record/Upload Media"]').remove();

          if (observerCompletedDictionary['div[id^="mceu"]'] === undefined) {
            observerCompletedDictionary['div[id^="mceu"]'] = 1;
          }

          if (
            observerCompletedDictionary['div[id^="mceu"]'] ===
            $('div[id^="mceu"]').length
          ) {
            observerCompletedDictionary['div[id^="mceu"]'] = true;
          } else {
            observerCompletedDictionary['div[id^="mceu"]']++;
          }
        }

        // switch rich text editor to html view
        if ($(".rce_links").length) {
          $(".rce_links").remove();
          observerCompletedDictionary[".rce_links"] = true;
        }

        if (
          Object.keys(observerCompletedDictionary).map(function (key) {
            return observerCompletedDictionary[key];
          }).length === 3 &&
          Object.keys(observerCompletedDictionary).every(function (key) {
            return observerCompletedDictionary[key];
          }) === true
        ) {
          observer.disconnect();
        }
      });
    });

    var config = {
      // attributes: true,
      childList: true,
      // characterData: true,
      subtree: true,
      // attributeOldValue:true,
      // characterDataOldValue:true,
    };

    observer.observe(document.body, config);
  } else if (
    $("#quiz_access_code").length !== 0 &&
    /courses\/\d+\/quizzes\/\d+\/take/g.test(window.location.href)
  ) {
    $("#header").remove();
    $("#left-side").remove();
    $("div.ic-app-nav-toggle-and-crumbs.no-print").remove();
    $("body:not(.no-headers).primary-nav-expanded .ic-Layout-wrapper").css(
      "margin-left",
      "0px"
    );
    $(
      "body.course-menu-expanded:not(.ic-no-flex-layout):not(.embedded):not(.is-inside-submission-frame) .ic-Layout-columns"
    ).css("margin-left", "0px");
    $("body:not(.no-headers).primary-nav-expanded .ic-Layout-wrapper").css(
      "max-width",
      "100%"
    );
  } else {
    $(".take_quiz_button").remove();
    $("#submit_quiz_form").remove();
    $("#SEB-detail").remove();
  }
}

if (
  /courses\/\d+\/assignments/g.test(window.location.href) &&
  $('*:contains("[SEB]")').length !== 0
) {
  if (
    navigator.userAgent.substring(
      navigator.userAgent.indexOf("key=") + 4,
      navigator.userAgent.indexOf(" SEB")
    ) === $("#SEB-data").data("value")
  ) {
    $("#header").remove();
    $("#left-side").remove();
    $("div.ic-app-nav-toggle-and-crumbs.no-print").remove();
    $("body:not(.no-headers).primary-nav-expanded .ic-Layout-wrapper").css(
      "margin-left",
      "0px"
    );
    $(
      "body.course-menu-expanded:not(.ic-no-flex-layout):not(.embedded):not(.is-inside-submission-frame) .ic-Layout-columns"
    ).css("margin-left", "0px");
    $("body:not(.no-headers).primary-nav-expanded .ic-Layout-wrapper").css(
      "max-width",
      "100%"
    );
    $("#SEB-instructions").remove();

    $("#assignment-speedgrader-link").html(function (index, html) {
      return html.replace(/[\n\r]/g, "");
    });
    $("#assignment-speedgrader-link").html(function (index, html) {
      return html.replace(
        '<a target="_blank" href="/courses/',
        '<a class="Button Button--link Button--link--has-divider Button--course-settings student_view_button" rel="nofollow" data-method="post" href="/courses/'
      );
    });
    $("#assignment-speedgrader-link").html(function (index, html) {
      return (
        html.substring(0, html.indexOf("gradebook")) +
        'student_view"><i class="icon-student-view"></i>Student view</a>'
      );
    });
  } else {
    $("a[class*='submit_assignment_link'").remove();
    $("#SEB-detail").remove();
  }
}

jQuery(document).ready(function () {
  // Learning Essentials
  // Open external tool in a new window
  $("#section-tabs li.section a.context_external_tool_18557").attr(
    "href",
    function () {
      return $(this).attr("href") + "?display=borderless";
    }
  );
  $("#section-tabs li.section a.context_external_tool_18557").attr(
    "target",
    "_blank"
  );

  $(".reset_course_content_button").hide();
  // SpeedGrader //
  // The first call from Toolbox will contain url parameter "h".
  // Subsequent navigation within SpeedGrader will contain ENV.speedGraderSelectedQuestionOid.
  if (
    window.location.href.indexOf("gradebook/speed_grader") > -1 &&
    (ENV.speedGraderSelectedQuestionOid || urlParam("h"))
  ) {
    ENV.speedGraderSelectedQuestionOid = urlParam("qoid")
      ? urlParam("qoid")
      : ENV.speedGraderSelectedQuestionOid;

    if (!ENV.speedGraderToolUrl) {
      ENV.speedGraderToolUrl = urlParam("h")
        ? "https://" + urlParam("h") + "/toolbox/RubricMarking/"
        : "https://learningtools.auckland.ac.nz/toolbox/RubricMarking/";

      ENV.speedGraderToolHost = urlParam("h")
        ? urlParam("h")
        : "learningtools.auckland.ac.nz";
    }

    var observer = new MutationObserver(function () {
      ENV.speedGraderLoaded = true;
    });

    var target = document.getElementById("speed_grader_loading");
    observer.observe(target, { attributes: true, attributeFilter: ["style"] });

    // If the speedGrader loads fast enough, the observer on the "Loading..." will not trigger.
    // becuase by the time this code runs, the loading label is already hidden.
    if ($("#speed_grader_loading").css("display") === "none") {
      ENV.speedGraderLoaded = true;
    }

    $.ajax({
      url: ENV.speedGraderToolUrl + "GetQuestionMapping",
      type: "GET",
      dataType: "jsonp",
      data: {
        courseId: parseInt(ENV.course_id),
        assignmentId: parseInt(ENV.assignment_id),
        loadFromCache: true,
      },
      success: function (data, textStatus, jqXhr) {
        if (data.length === 0) {
          return;
        }

        var observer1 = new MutationObserver(function () {
          $(".rating-tier").unbind("click", setRatingDisplay);

          if ($("#rubric_full").css("display") !== "none") {
            $(".rating-tier").bind("click", setRatingDisplay);
          }

          $("td[data-testid='criterion-points'] input")
            .unbind("change input keyup", onCriterionPointsInputChange)
            .on("change input keyup", onCriterionPointsInputChange);
        });

        var rubricHolder = document.getElementById("rubric_full");
        observer1.observe(rubricHolder, {
          attributes: true,
          attributeFilter: ["style"],
        });

        // Most logic will only work once the SpeedGrader is fully loaded.
        // Add on-change event after the SpeedGrader has loaded.
        // Wait for the "Loading..." message to be hidden.
        if (ENV.speedGraderLoaded) {
          speedGraderInit(data);
          return;
        }

        var isLoadedChecker = setInterval(function () {
          checkIsSpeedGraderLoaded();
        }, 100);

        function checkIsSpeedGraderLoaded() {
          if (ENV.speedGraderLoaded) {
            clearInterval(isLoadedChecker);
            speedGraderInit(data);
          }
        }
      },
    });
  }

  setTimeout(function () {
    $(".footer-logo").after(
      "<span id='footer-links-new'><a href='https://www.instructure.com/policies/terms-of-use' target='_blank'>Terms of Service</a><a href='https://www.auckland.ac.nz/en/about/the-university/how-university-works/policy-and-administration/computing/use/it-acceptable-use-policy.html' target='_blank'>ICT Acceptable Use Policy</a> <a href='https://www.auckland.ac.nz/en/about/the-university/how-university-works/policy-and-administration/computing/use/student-communications.html' target='_blank'>Email Policy</a> <a href='https://www.myaucklanduni.ac.nz' target='_blank'>MyAucklandUni</a> <a href='https://www.auckland.ac.nz/en/students/my-tools/kahu.html' target='_blank'>Download K&#257;hu</a><a href='https://auckland.au.panopto.com/Panopto/Pages/Home.aspx' target='_blank'>Panopto Video</a></span>"
    );
    $(".add_access_token_link").hide();
    $('a[href^="/courses/"][href$="/confirm_action?event=conclude"]').hide();
    $('a[href^="/courses/"][href$="/confirm_action?event=delete"]').hide();
    $("#gradebook-toolbar #gradebook-actions").prepend(
      '<a href="' +
        $(location)
          .attr("pathname")
          .replace("gradebook", "external_tools/1187") +
        '" class="Button individual-view-button" id="change_gradebook_submit_upload_link_holder" type="button">Prepare Grades for SSO</a>'
    );
    $("#gradebook_wrapper .header-buttons").prepend(
      '<a href="' +
        $(location)
          .attr("pathname")
          .replace("gradebook", "external_tools/1187") +
        '" class="Button individual-view-button" id="change_gradebook_submit_upload_link_holder" type="button">Prepare Grades for SSO</a>'
    );
    $("#content #assignments #grades_summary").before(
      '<div style="display: inline-block;"><p>The marks or grades returned to you in Canvas are not final and may still be subject to review. Your final and approved grade for any course will be published to you via Student Services Online.</p></div>'
    );

    // embed recording toggle
    $(document).on("click", "a.embed-recording-preview", function () {
      var $this = $(this);
      var img = $this.children("img");
      var iframe = $("#" + img.attr("data-id"));

      iframe.attr("width", img.attr("width"));
      iframe.attr("height", img.attr("height"));
      iframe.attr("src", img.attr("data-src"));
      iframe.toggleClass("hidden", false);
      $this.toggleClass("hidden", true);
    });
  }, 500);
});

function speedGraderInit(data) {
  // track which question(s) the user has been grading for the current student.
  // hold the QuestionOID of the question(s).
  ENV.speedGraderGradedQuestionOids = [];
  ENV.speedGraderQuestionMap = [];
  ENV.speedGraderStudentId = ENV.RUBRIC_ASSESSMENT.assessment_user_id;

  $("#rubric_holder").append(
    "<div id='loadingAnimationContainer' class='hide'>" +
      "<div id='loadingAnimation'>" +
      "<div class='lds-ring'><div></div><div></div><div></div><div></div></div>" +
      "<div>Loading latest scores</div></div></div>"
  );

  $("#submission_details").after(
    "<div id='mapping_container' class='content_box'>" +
      "<h2 class='gradebookHeader--rightside'>View by Question</h2>" +
      "<select id='rubricQuestionSelect' style='width: 100%;'></select>" +
      "<button id='nextUngraded' class='btn btn-block'>Go to Next Ungraded Submission</button>" +
      "</div>"
  );

  data.forEach(function (mapping) {
    if (ENV.speedGraderSelectedQuestionOid === mapping.Qoid) {
      $("#rubricQuestionSelect").append(
        "<option value='" +
          mapping.Cids +
          "' " +
          "data-qoid='" +
          mapping.Qoid +
          "' selected>" +
          mapping.Qname +
          "</button>"
      );
    } else {
      $("#rubricQuestionSelect").append(
        "<option value='" +
          mapping.Cids +
          "' " +
          "data-qoid='" +
          mapping.Qoid +
          "'>" +
          mapping.Qname +
          "</button>"
      );
    }

    var cids = mapping.Cids.split(",")
      .filter((cid) => cid !== "")
      .map((x) => x.replace("criterion_", ""));

    ENV.speedGraderQuestionMap.push({
      qoid: mapping.Qoid,
      cids: cids,
    });
  });

  $(".hide_rubric_link").after(
    "<span id='savedConfirmation' class='text-success hide' " +
      "style='margin-left:50px; font-size:1em'>Saved successfully</span>"
  );

  // Remove all the original event handlers for the save button.
  // We will control the saving ourselves.
  $("button.save_rubric_button")[0].outerHTML = $(
    "button.save_rubric_button"
  )[0].outerHTML;

  $("#nextUngraded").bind("click", loadNextUngradedStudent);
  $("button.toggle_full_rubric").bind("click", startGrading);
  $("button.save_rubric_button").bind("click", finishGrading);
  $("button.hide_rubric_link").bind("click", function () {
    consoleLog("Cancel button is triggered.");
    cancelGrading();
  });

  $("#rubricQuestionSelect").bind("change", function () {
    disableSpeedGraderNav();
    ENV.speedGraderSelectedQuestionOid = $(
      "#rubricQuestionSelect option:selected"
    ).data("qoid");
    consoleLog(
      "SpeedGrader is now switching to a new question " +
        ENV.speedGraderSelectedQuestionOid
    );

    // Dont need to call startGrading() here,
    // because switch question is done under the context of the view model,
    // so if the student is already in grading model, startGrading would
    // have already been called, calling it again will wipe any changes on the
    // previous question.
    var isEditing = isSpeedGraderInMarkingMode();
    setQuestionDisplay();
    setTotalDisplay(isEditing);

    // track grading on a new question.
    if (isEditing) {
      trackGradingStart();

      if (
        ENV.speedGraderGradedQuestionOids.indexOf(
          ENV.speedGraderSelectedQuestionOid
        ) < 0
      ) {
        ENV.speedGraderGradedQuestionOids.push(
          ENV.speedGraderSelectedQuestionOid
        );
      }

      consoleLog(
        "Client side is now tracking question(s): " +
          ENV.speedGraderGradedQuestionOids.join(", ")
      );
    }

    enableSpeedGraderNav();
  });

  // Catch student change event when user click on the arrows or use the name drop down list
  // in the top right corner of SpeedGrader.
  $("#combo_box_container").on(
    "change",
    "#students_selectmenu",
    changeCurrentStudent
  );
  $(".studentSelection").on(
    "click",
    "button.gradebookMoveToNext",
    changeCurrentStudent
  );

  // for students who do not have rubric score,
  // there is no table under rubric_container initially.
  if ($(sgSummaryContainers.join(",")).find("table").length > 0) {
    // populate the full set of criteria into Student Map.
    refreshCriteriaData([]);

    // Filter the rubric grid to show only the criteria related to the current questeion.
    setQuestionDisplay();
    setTotalDisplay(false);
  }
}

function urlParam(name) {
  var results = new RegExp("[?&]" + name + "=([^&#]*)").exec(
    window.location.href
  );
  if (results == null) {
    return null;
  } else {
    return decodeURI(results[1]) || 0;
  }
}

function changeCurrentStudent() {
  // for unknown reasons, this event can get triggered multiple times in a single user action.
  // so we will track the current student ourselves and only run the handler code if the new
  // student is different than the current student.
  if (ENV.speedGraderStudentId === ENV.RUBRIC_ASSESSMENT.assessment_user_id) {
    return;
  }

  // Hide the avatar photo, because our way of switching user doesnt update the photo.
  $("#avatar_image").css("display", "none");

  consoleLog(
    "SpeedGrader is now switching to a new student " +
      ENV.RUBRIC_ASSESSMENT.assessment_user_id +
      " from " +
      ENV.speedGraderStudentId
  );
  ENV.speedGraderStudentId = ENV.RUBRIC_ASSESSMENT.assessment_user_id;

  // SpeedGrader load the next student almost immediately,
  // so by the time this code run, the new student is already set in ENV.
  if (isSpeedGraderInMarkingMode()) {
    disableSpeedGraderNav();
    cancelGrading();
    startGrading();
  } else {
    disableSpeedGraderNav();
    refreshCriteriaData([]);
    setQuestionDisplay();
    setTotalDisplay(false);
    enableSpeedGraderNav();
  }
}

/// We are using SpeedGrader's internal data model
/// with additional properties to help us tracking the UI elements.
function refreshCriteriaData(data) {
  var studentMap =
    jsonData.studentMap[ENV.RUBRIC_ASSESSMENT.assessment_user_id];
  var criteria = ENV.rubric.criteria;

  if (!data) {
    data = [];
  }

  // student map wont always be populated with all rubric assessment data.
  // Students who havent been graded wont have data here.
  // But for our functionalities, we will populate all rubric data in student map.
  if (studentMap.rubric_assessments.length === 0) {
    studentMap.rubric_assessments.push({ data: [] });
  }

  var studentMapRubricData = studentMap.rubric_assessments[0].data;
  var totalPoints = 0;
  var totalPointsPossible = 0;
  var descriptionSpans = $(sgDescriptionSpanSelectors);

  // ENV.rubric.criteria will always contain the full set of rubric,
  // so we will use that as the base to loop through.
  criteria.forEach(function (criterion) {
    var studentCriterionData = window.arrayFind(
      studentMapRubricData,
      "criterion_id",
      criterion.id
    );
    var newCriterionData = window.arrayFind(data, "CriterionId", criterion.id);
    var trs = [];

    if (studentCriterionData === undefined) {
      // Things like comments_enabled and learning_outcome_id,
      // we dont know the logic behind them, so we cant set the values properly.
      studentCriterionData = {
        comments: null,
        comments_endabled: true,
        criterion_id: criterion.id,
        description: criterion.description,
        id: "",
        learning_outcome_id: null,
        points: null,
        pointsPossible: criterion.points,
      };

      studentMapRubricData.push(studentCriterionData);
    } else {
      // pointsPossible is not a native property in SpeedGrader
      studentCriterionData.pointsPossible = criterion.points;
    }

    // update student map data with latest.
    if (newCriterionData) {
      studentCriterionData.points = newCriterionData.Points;
      studentCriterionData.comments = newCriterionData.Comments
        ? newCriterionData.Comments
        : null;
      setCriterionDisplay(newCriterionData);
    }

    if (studentCriterionData.points) {
      totalPoints = totalPoints + studentCriterionData.points;
    }

    if (studentCriterionData.pointsPossible) {
      totalPointsPossible =
        totalPointsPossible + studentCriterionData.pointsPossible;
    }

    // map the rows from rubric grids (there are two, one for edit, one for display)
    // we have to redo this step between viewing mode and edit mode,
    // because the row content is dymanically generated, so caching the row reference like this
    // wont work in term of finding input controls within it.
    for (var i = 0, len = descriptionSpans.length; i < len; i++) {
      var descriptionSpan = $(descriptionSpans[i]);

      if (descriptionSpan.html() === criterion.description) {
        trs.push(descriptionSpan.closest("tr"));
      }
    }

    criterion.trs = trs;
  });

  $("span[data-selenium*='rubric_total']").text(
    "Total Points: " + totalPoints + " out of " + totalPointsPossible
  );
}

function trackGradingStart() {
  // The different between this one vs startGrading() is this one only add the server side tracking
  // it does not impact on the UI.
  $.ajax({
    url: ENV.speedGraderToolUrl + "startGradingQuestion",
    type: "GET",
    dataType: "jsonp",
    data: {
      courseId: parseInt(ENV.course_id),
      assignmentId: parseInt(ENV.assignment_id),
      userId: ENV.RUBRIC_ASSESSMENT.assessment_user_id,
      assessorUserId: parseInt(ENV.RUBRIC_ASSESSMENT.assessor_id),
      qOid: ENV.speedGraderSelectedQuestionOid,
    },
    success: function (data) {
      if (typeof data === "string") {
        alert("Error: " + data);
        return;
      }

      consoleLog(
        "Updated server-side tracking: user ID " +
          ENV.RUBRIC_ASSESSMENT.assessment_user_id +
          " question OID " +
          ENV.speedGraderSelectedQuestionOid
      );
    },
  });
}

function startGrading() {
  // Disable SpeedGrader navigation.
  // Track assessor in the database.
  // Get latest rubric score (for all criteria in the assignment) for the selected student.
  // Reload SpeedGrader if the score on the client side is out-of-date.
  // Enable SpeedGrader navigation.
  disableSpeedGraderNav();
  sgGradingContainers.forEach(function (m) {
    $(m).addClass("hide");
  });

  $(".save_rubric_button").parent(".button-container").addClass("hide");
  $("#loadingAnimationContainer").removeClass("hide");

  if (
    ENV.speedGraderGradedQuestionOids.indexOf(
      ENV.speedGraderSelectedQuestionOid
    ) < 0
  ) {
    ENV.speedGraderGradedQuestionOids.push(ENV.speedGraderSelectedQuestionOid);
  }

  consoleLog(
    "Tracking question(s): " + ENV.speedGraderGradedQuestionOids.join(", ")
  );

  $.ajax({
    url: ENV.speedGraderToolUrl + "startGradingQuestion",
    type: "GET",
    dataType: "jsonp",
    data: {
      courseId: parseInt(ENV.course_id),
      assignmentId: parseInt(ENV.assignment_id),
      userId: ENV.RUBRIC_ASSESSMENT.assessment_user_id,
      assessorUserId: parseInt(ENV.RUBRIC_ASSESSMENT.assessor_id),
      qOid: ENV.speedGraderSelectedQuestionOid,
    },
    success: function (data) {
      if (typeof data === "string") {
        alert("Error: " + data);
        enableSpeedGraderNav();
        return;
      }

      consoleLog(
        "Updated server-side tracking: user ID " +
          ENV.RUBRIC_ASSESSMENT.assessment_user_id +
          " question OID " +
          ENV.speedGraderSelectedQuestionOid
      );

      refreshCriteriaData(data);
      setQuestionDisplay();
      setTotalDisplay(true);
      enableSpeedGraderNav();

      // Hide the loading spiner and show the rubric table.
      $("#loadingAnimationContainer").addClass("hide");
      sgGradingContainers.forEach(function (m) {
        $(m).removeClass("hide");
      });

      // Show the save button.
      $(".save_rubric_button").parent(".button-container").removeClass("hide");
    },
  });
}

function finishGrading() {
  disableSpeedGraderNav();

  // Building up the list of criteria that actually changed.
  // If questions share common criteria, then this logic may not be accurate.
  // For example if Question 1 and 2 both link to criteria A,
  // user marks Q1, navigate to Q2, then save changes.
  // Then even though Q2 has not been marked, as long as criteria A has been changed,
  // Q2 will also be treated as marked by this user.
  var criteria = ENV.rubric.criteria;
  var criteriaChanged = [];
  var rubricAssessments = [];

  criteria.forEach(function (criterion) {
    var trs = criterion.trs;
    var rubricAssessment = window.arrayFind(
      jsonData.studentMap[ENV.RUBRIC_ASSESSMENT.assessment_user_id]
        .rubric_assessments[0].data,
      "criterion_id",
      criterion.id
    );

    // For each row associated with the criterion,
    // check if it's a row from the editing grid,
    // check if there is any changes from that row.
    trs.forEach(function (tr) {
      var pointsInput = tr.find("td[data-testid='criterion-points'] input");
      var commentsTextarea = tr.find("textarea");

      // not every row is from the editing grid.
      if (pointsInput.length === 0) {
        return;
      }

      // isNaN() check is not catching all the cases, for examle things like "".
      // Best way is to let parseFloat return NaN, then check directly against that.
      var newPoints = isNaN(parseFloat(pointsInput.val()))
        ? null
        : parseFloat(pointsInput.val());

      // when comments textarea is already shown and
      // user clear the comments, the val() will return "".
      var newComments =
        commentsTextarea.length === 0 || commentsTextarea.val() === ""
          ? null
          : commentsTextarea.val();

      // If points has been updated.
      // It's really hard to do this check, because javascript is not strongly type and
      // there can be so many combinations that will compare as equal but are actually different values.
      // val() return string value, .points stores numeric vale, so !== doesnt work here.
      if (rubricAssessment.points !== newPoints) {
        // Add to the list of criteria that have changed.
        if (criteriaChanged.indexOf(criterion.id) === -1) {
          criteriaChanged.push(criterion.id);
          rubricAssessments.push(rubricAssessment);
        }

        rubricAssessment.points = newPoints;
      }

      // if comments have been updated.
      if (rubricAssessment.comments != newComments) {
        // Add to the list of criteria that have changed.
        if (criteriaChanged.indexOf(criterion.id) === -1) {
          criteriaChanged.push(criterion.id);
          rubricAssessments.push(rubricAssessment);
        }

        rubricAssessment.comments = newComments;
      }
    });
  });

  // If there are no changes to be saved, exit the method.
  if (rubricAssessments.length === 0) {
    enableSpeedGraderNav();

    $("#savedConfirmation").text("No change").removeClass("hide");

    setTimeout(function () {
      $("#savedConfirmation").addClass("hide");
    }, 1500);

    return;
  }

  // Need to find out which questions contain changes.
  var qoids = ENV.speedGraderGradedQuestionOids.filter(function (qoid) {
    var questionMap = window.arrayFind(
      ENV.speedGraderQuestionMap,
      "qoid",
      qoid
    );

    return criteriaChanged.some(
      (criterionId) => questionMap.cids.indexOf(criterionId) >= 0
    );
  });

  // jsonp ajax cant use error hanlder.
  consoleLog("Saving question(s): " + qoids.join(", "));

  $.ajax({
    url: ENV.speedGraderToolUrl + "finishGradingQuestion",
    type: "GET",
    dataType: "jsonp",
    data: {
      courseId: parseInt(ENV.course_id),
      assignmentId: parseInt(ENV.assignment_id),
      userId: ENV.RUBRIC_ASSESSMENT.assessment_user_id,
      assessorUserId: parseInt(ENV.RUBRIC_ASSESSMENT.assessor_id),
      qOids: qoids.join(),
      rubricAssessmentsString: JSON.stringify(rubricAssessments, [
        "criterion_id",
        "comments",
        "points",
      ]),
    },
    success: function (data) {
      if (typeof data === "string") {
        alert("Error: " + data);
        enableSpeedGraderNav();
        return;
      }

      // Not reloading SpeedGrader even if there are new marks,
      // because for the questions that the user marked,
      // it becomes the latest score for those questions,
      // so the only marks that may be new will come from other questions,
      // which the user may not be interested.
      refreshCriteriaData(data);

      // Reset tracking data.
      // Because user stay on edit mode after saving,
      // the current question is still in grading.
      ENV.speedGraderGradedQuestionOids = [ENV.speedGraderSelectedQuestionOid];

      consoleLog(
        "Tracking question(s): " + ENV.speedGraderGradedQuestionOids.join(", ")
      );

      setQuestionDisplay();
      setTotalDisplay(true);
      enableSpeedGraderNav();

      $("#savedConfirmation").text("Saved successfully").removeClass("hide");

      setTimeout(function () {
        $("#savedConfirmation").addClass("hide");
      }, 1500);
    },
  });
}

function cancelGrading() {
  // Clear any question tracking data.
  // thid method is used by code that return user back to view model.
  // but it's also used by code that called after a saving operation is finished,
  // in which case the user is still in editing, so the current Question OID need
  // be to added back to this array.
  ENV.speedGraderGradedQuestionOids = [];

  consoleLog("Tracking question(s): none");

  // The total will change because when in editing we are based the total on modified points,
  // when editing is cancel, the total need to be reverted to original points.
  setTotalDisplay(false);
}

function loadNextUngradedStudent() {
  disableSpeedGraderNav();

  $.ajax({
    url: ENV.speedGraderToolUrl + "GetNextUserToGrade",
    type: "GET",
    dataType: "jsonp",
    data: {
      courseId: parseInt(ENV.course_id),
      assignmentId: parseInt(ENV.assignment_id),
      userId: ENV.RUBRIC_ASSESSMENT.assessment_user_id,
      assessorUserId: parseInt(ENV.RUBRIC_ASSESSMENT.assessor_id),
      qOid: ENV.speedGraderSelectedQuestionOid,
    },
    success: function (data) {
      enableSpeedGraderNav();

      if (data) {
        ENV.RUBRIC_ASSESSMENT.assessment_user_id = data;

        // This will update most of the UI in SpeedGrader without hitting the user with slow "loading..." message.
        $("#students_selectmenu").val(data).change();

        // This update the drop down list display on the top right corner of SpeedGrader
        // this look something like "Student 867 - not submitted",
        // we will take out the status part.
        var studentName = $("#students_selectmenu option:selected").text();

        // the dash caracter (-) is really hard to track, it's not a simple string character.
        // so we have to use the char code here.
        var hashIndex = -1;

        for (var i = 0, n = studentName.length; i < n; i++) {
          if (studentName.charCodeAt(i) === 8211) {
            hashIndex = i;
            break;
          }
        }

        if (hashIndex > 0) {
          studentName = studentName.substring(0, hashIndex);
        }

        $(".ui-selectmenu-status .ui-selectmenu-item-header").html(studentName);
      } else {
        $("#nextUngraded")
          .text(
            "All students with submission have been graded against this question"
          )
          .prop("disabled", true);
      }
    },
  });
}

function setQuestionDisplay() {
  // Changing question context will reset the next ungraded button,
  // so user can try to find an ungraded student again.
  $("#nextUngraded")
    .text("Go to Next Ungraded Submission")
    .prop("disabled", false);

  // Hide all criteria rows, then show the ones related to the current question.
  $(sgDescriptionSpanSelectors).closest("tr").addClass("hide");

  // Find the criteria associated with the current question.
  // Find the rows which associated with the selected criteria. And unhide these rows.
  var trs = getCriterionRowsByQuestion(ENV.speedGraderSelectedQuestionOid);

  if (trs.length > 0) {
    trs.forEach(function (tr) {
      tr.removeClass("hide");
    });
  }

  consoleLog("Show question " + ENV.speedGraderSelectedQuestionOid);
}

function setCriterionDisplay(newCriterionData) {
  var selector = sgGradingContainers
    .map(function (m) {
      return m + " div.description span";
    })
    .join(",");
  var $tr = $(selector)
    .filter(function () {
      return $(this).text() === newCriterionData.CrierionDescription;
    })
    .closest("tr");

  // Set the Points input field with the latest score.
  // Points = 0 will be treated as false, so we have to specifically checking for null here.
  // Excluding Save Comments drop down list.
  if (
    isNaN(newCriterionData.Points) ||
    newCriterionData.Points === null ||
    newCriterionData.Points === ""
  ) {
    $tr.find("input[role!='combobox']").val("--");
  } else {
    $tr.find("input[role!='combobox']").val(newCriterionData.Points);

    var invalidScoreSpan = $tr
      .find("span:contains('Invalid score')")
      .filter(function () {
        return $(this).children().length === 0;
      });

    // Clear the "invalid score" red text.
    // Dont touch the display status of html status, because SpeedGrader code is managing it.
    // This also only works one way,
    // we can not turn on the "Invalid Score" display, because the styling is also managed by React class.
    // But that is minor issue.
    if (invalidScoreSpan.length > 0) {
      invalidScoreSpan.text("");
    }
  }

  if (newCriterionData.Comments) {
    var button = $tr.find("button");

    if (button.length > 0) {
      button.click();
    }

    $tr
      .find("textarea")
      .val(newCriterionData.Comments)
      .html(newCriterionData.Comments);
  } else {
    $tr.find("textarea").val("").html("");
  }

  // Remove all native event handler for comment textarea,
  // because it will revert the old comments back when user select a different rating.
  var textareaId = $tr.find("textarea").attr("id");

  if ($("#" + textareaId).length > 0) {
    $("#" + textareaId)[0].outerHTML = $("#" + textareaId)[0].outerHTML;
  }

  // When Saved Comments drop down list change, change the Comments textarea.
  // This is really hard to do, because change event on the combobox input is not triggered.
  $tr.find("input[role='combobox']").bind("click", function () {
    $(this).attr("data-oldValue", $(this).val());
    setTimeout(setCommentsFromCombobox, 200);
  });

  // Hide "Save this comment for reuse" button, because we are taking over the save button,
  // so there is no way to save a comment for reuse.
  $("td.ratings input[type='checkbox']").parent().addClass("hide");

  $tr.find("div.rating-tier").removeClass("selected");
  $tr
    .find("div.rating-tier div.shader")
    .removeClass()
    .addClass("shader")
    .css("background-color", "transparent")
    .attr("aria-label", "");

  // Rating description
  // Description vary depends on if the rubric is using range point or not.
  // Range point description looks like "10 to >6 pts"
  var ratingPointSpans = $tr.find("div.rating-points span");
  var selectedRatingPoints =
    ratingPointSpans.length > 0 && ratingPointSpans.text().indexOf(">") > 0
      ? ratingPointSpans.filter(function () {
          var pointParts = $(this)
            .text()
            .replace(" to ", "")
            .replace(" pts", "")
            .split(">");

          return (
            newCriterionData.Points <= parseFloat(pointParts[0]) &&
            newCriterionData.Points > parseFloat(pointParts[1])
          );
        })
      : ratingPointSpans.filter(function () {
          return $(this).text() === newCriterionData.Points + " pts";
        });

  // view-only mode
  var selectors = sgSummaryContainers
    .map(function (m) {
      return m + "  div.description span";
    })
    .join(",");

  $tr = $(selectors)
    .filter(function () {
      return $(this).text() === newCriterionData.CrierionDescription;
    })
    .closest("tr");

  if (newCriterionData.Description) {
    $tr.find("div.rating-description span").text(newCriterionData.Description);
  } else {
    $tr.find("div.rating-description span").text("No details");
  }

  // View mode: comments
  $tr.find(".react-rubric-break-words span").html("");

  if (newCriterionData.Comments) {
    $tr
      .find(".react-rubric-break-words span")
      .append("<div><div>" + newCriterionData.Comments + "</div></div>");
  }

  // This is the safest way to check for the display logic.
  if (isNaN(parseFloat(newCriterionData.Points))) {
    $tr
      .find("div.graded-points")
      .text("-- / " + newCriterionData.PointsPossible + " pts");
  } else {
    $tr
      .find("div.graded-points")
      .text(
        newCriterionData.Points +
          " / " +
          newCriterionData.PointsPossible +
          " pts"
      );
  }

  // Set all the shaders and triangle indicators to transparent
  var viewModeShader = $tr
    .find("div.shader")
    .removeClass()
    .addClass("shader")
    .attr("aria-label", "")
    .css("background-color", "rgba(0, 0, 0, 0)");

  $tr.find("div.shader div.triangle").css("border-bottom-color", "transparent");

  if (selectedRatingPoints.length > 0) {
    // color the cell bottom border indicating how well the student score.
    // the edit mode.
    var editRating = selectedRatingPoints.closest("div.rating-tier");

    editRating.addClass("selected");

    // the view mode.
    var viewRating = $tr.find("div.rating-all .rating-tier");

    viewRating.addClass("selected");

    if (editRating.is(":first-child")) {
      viewRating
        .find("div.shader")
        .addClass("meetsMasteryShader")
        .css("background-color", "");
      viewModeShader.addClass("meetsMasteryShader");
      editRating
        .find("div.shader")
        .addClass("meetsMasteryShader")
        .css("background-color", "")
        .attr("aria-label", "This rating is selected");
    } else if (editRating.is(":last-child")) {
      viewRating
        .find("div.shader")
        .addClass("wellBelowMasteryShader")
        .css("background-color", "");
      viewModeShader.addClass("wellBelowMasteryShader");
      editRating
        .find("div.shader")
        .addClass("wellBelowMasteryShader")
        .css("background-color", "")
        .attr("aria-label", "This rating is selected");
    } else {
      viewRating
        .find("div.shader")
        .addClass("nearMasteryShader")
        .css("background-color", "");
      viewModeShader.addClass("nearMasteryShader");
      editRating
        .find("div.shader")
        .addClass("nearMasteryShader")
        .css("background-color", "")
        .attr("aria-label", "This rating is selected");
    }

    editRating.find("div.shader div.triangle").css("border-bottom-color", "");
    viewRating.find("div.shader div.triangle").css("border-bottom-color", "");
  }
}

function setTotalDisplay(isEditing) {
  // Update total points display based on which criteria are shown.
  var questionMap = window.arrayFind(
    ENV.speedGraderQuestionMap,
    "qoid",
    ENV.speedGraderSelectedQuestionOid
  );
  var totalPoints = 0;
  var totalPointsPossible = 0;

  // cancelGrading also call this method, at this point the rubric assessments hasnt been populated.
  if (
    jsonData.studentMap[ENV.RUBRIC_ASSESSMENT.assessment_user_id]
      .rubric_assessments.length === 0
  ) {
    return;
  }

  questionMap.cids.forEach(function (cid) {
    var criterion = window.arrayFind(ENV.rubric.criteria, "id", cid);

    // When it's viewing mode and the student hasnt been graded yet, the rubric table will be hidden.
    // Which means there is no rows cached at each criterion.
    if (criterion.trs === undefined) {
      return;
    }

    var pointInputSelector = criterion.trs.map(function (tr) {
      return tr.find("td[data-testid='criterion-points'] input");
    });

    var rubricAssessment = window.arrayFind(
      jsonData.studentMap[ENV.RUBRIC_ASSESSMENT.assessment_user_id]
        .rubric_assessments[0].data,
      "criterion_id",
      cid
    );

    // Not every element in the pointInputs array has an input control,
    // because the search is performed on the view mode row too.
    var isAdded = false;

    pointInputSelector.forEach(function (pointInput) {
      // for this criterion, the points already added to total.
      if (isAdded) {
        return;
      }

      if (pointInput.length === 0) {
        // this means the table has not been loaded by SpeedGrader yet,
        // we can base of rubricAssessment.
        if (
          !isNaN(rubricAssessment.points) &&
          rubricAssessment.points !== null &&
          rubricAssessment.points !== ""
        ) {
          totalPoints = totalPoints + rubricAssessment.points;
          isAdded = true;
        }
      } else if (
        isEditing &&
        !isNaN(pointInput.val()) &&
        pointInput.val() !== null &&
        pointInput.val() !== ""
      ) {
        // isNaN("") is false
        totalPoints = totalPoints + parseFloat(pointInput.val());
        isAdded = true;
      } else if (
        !isEditing &&
        !isNaN(rubricAssessment.points) &&
        rubricAssessment.points !== null &&
        rubricAssessment.points !== ""
      ) {
        // isNaN(null) will return false. so we need to check for null explicitly.
        totalPoints = totalPoints + rubricAssessment.points;
        isAdded = true;
      }
    });

    totalPointsPossible = totalPointsPossible + criterion.points;
  });

  $("span[data-selenium*='rubric_total']").text(
    "Total Points: " + totalPoints + " out of " + totalPointsPossible
  );

  // This one shows total points from all criteria regardless of question.
  // This is used to display in the overall mark textbox,
  // when student has not been graded, this textbox should be blank rather than 0.
  totalPoints = null;

  ENV.rubric.criteria.forEach(function (criterion) {
    if (criterion.trs === undefined) {
      return;
    }

    var pointInputSelector = criterion.trs.map(function (tr) {
      return tr.find("td[data-testid='criterion-points'] input");
    });

    var rubricAssessment = window.arrayFind(
      jsonData.studentMap[ENV.RUBRIC_ASSESSMENT.assessment_user_id]
        .rubric_assessments[0].data,
      "criterion_id",
      criterion.id
    );

    var isAdded = false;

    pointInputSelector.forEach(function (pointInput) {
      // for this criterion, the points already added to total.
      if (isAdded) {
        return;
      }

      if (pointInput.length === 0) {
        if (
          !isNaN(rubricAssessment.points) &&
          rubricAssessment.points !== null &&
          rubricAssessment.points !== ""
        ) {
          totalPoints = totalPoints === null ? 0 : totalPoints;
          totalPoints = totalPoints + rubricAssessment.points;
          isAdded = true;
        }
      } else if (
        isEditing &&
        !isNaN(pointInput.val()) &&
        pointInput.val() !== null &&
        pointInput.val() !== ""
      ) {
        // isNaN("") is false
        totalPoints = totalPoints === null ? 0 : totalPoints;
        totalPoints = totalPoints + parseFloat(pointInput.val());
        isAdded = true;
      } else if (
        !isEditing &&
        !isNaN(rubricAssessment.points) &&
        rubricAssessment.points !== null &&
        rubricAssessment.points !== ""
      ) {
        // isNaN(null) will return false. so we need to check for null explicitly.
        totalPoints = totalPoints === null ? 0 : totalPoints;
        totalPoints = totalPoints + rubricAssessment.points;
        isAdded = true;
      }
    });
  });

  if (totalPoints === null) {
    $("#grading-box-extended").val("");
  } else {
    $("#grading-box-extended").val(totalPoints);
  }
}

function setRatingDisplay() {
  // selected rating will be set by SpeedGrader code,
  // here we only need to remove the select style from other ratings,
  // Because if these styles are added by our code, SpeedGrader will not remove them for us.
  var otherRatings = $(this).siblings();

  otherRatings.removeClass("selected");
  otherRatings
    .find("div.shader")
    .removeClass()
    .addClass("shader")
    .attr("aria-label", "")
    .css("background-color", "rgba(0, 0, 0, 0)");
  otherRatings
    .find("div.shader div.triangle")
    .css("border-bottom-color", "transparent");

  // Selecting a new rating will automated update the pts input box,
  // but it wont trigger our input change event,
  // so we have to manually call the update total here.
  // and we have to run this on a delay too,
  // because SpeedGrader is also trying to update the total display.
  setTimeout(function () {
    setTotalDisplay(true);
  }, 100);
}

function disableSpeedGraderNav() {
  $("#nextUngraded").prop("disabled", true);
  $("#rubricQuestionSelect").prop("disabled", true);
  $("#combo_box_container").prop("disabled", true);
  $("button.save_rubric_button").prop("disabled", true);
  $("button.hide_rubric_link").prop("disabled", true);

  $(".studentSelection *").disable();
  $("#combo_box_container").css("visibility", "hidden");
}

function enableSpeedGraderNav() {
  var disableUngraded =
    $("#nextUngraded").text() !== "Go to Next Ungraded Submission";

  $("#nextUngraded").prop("disabled", disableUngraded);
  $("#rubricQuestionSelect").prop("disabled", false);
  $("#combo_box_container").prop("disabled", false);
  $("button.save_rubric_button").prop("disabled", false);
  $("button.hide_rubric_link").prop("disabled", false);

  $(".studentSelection *").enable();
  $("#combo_box_container").css("visibility", "visible");
}

function onCriterionPointsInputChange(arg) {
  var $this = $(arg.currentTarget);
  var oldValue = $this.attr("data-oldValue");

  if (!oldValue || oldValue !== $this.val()) {
    // SpeedGrader is also setting the total display,
    // so if we want to override it we need to run this on a delay.
    setTimeout(function () {
      setTotalDisplay(true);
    }, 100);
    $this.attr("data-oldValue", $this.val());
  }
}

function isSpeedGraderInMarkingMode() {
  return $(sgGradingContainers.join(",")).is(":visible");
}

function setCommentsFromCombobox() {
  $("input[role='combobox']").each(function () {
    var $this = $(this);
    var oldValue = $this.attr("data-oldValue");

    if ($this.attr("aria-expanded") === "true") {
      setTimeout(setCommentsFromCombobox, 200);
      return;
    }

    if ($this.val() !== oldValue) {
      if ($this.val() === "[ Select ]") {
        $this.attr("data-oldValue", "");
        return;
      }

      $this.attr("data-oldValue", $this.val());
      $this
        .closest(".ratings")
        .find("textarea")
        .val($this.val())
        .html($this.val());
    }
  });
}

function getCriterionRowsByQuestion(qoid) {
  // Find the criteria associated with the question.
  var questionMap = window.arrayFind(ENV.speedGraderQuestionMap, "qoid", qoid);
  var trs = [];

  // Find the rows which associated with the selected criteria. And unhide these rows.
  questionMap.cids.forEach(function (cid) {
    var criterion = window.arrayFind(ENV.rubric.criteria, "id", cid);

    trs = trs.concat(criterion.trs);
  });

  return trs;
}

function consoleLog(message) {
  if (ENV.speedGraderToolUrl.indexOf("learningtools.auckland.ac.nz") > 0) {
    return;
  }

  console.log(message);
}

// A drop-in replacement for the functionality in Canvas LMS that makes jqueryUI widgets out of your user content
!(function (s, d, url, e, p) {
  (e = d.createElement(s)), (p = d.getElementsByTagName(s)[0]);
  e.async = 1;
  e.src = url;
  p.parentNode.insertBefore(e, p);
})("script", document, "https://unpkg.com/widgetize-canvas-lms-user-content");

// e.g. window.arrayFind(purposeObjects, "purpose", "daily");
window.arrayFind = function (array, prop, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (prop) {
      if (array[i] && array[i][prop] === value) return array[i];
    } else {
      if (array[i] && array[i] === value) return array[i];
    }
  }
};

$.fn.disable = function () {
  this.each(function () {
    if (typeof this.disabled != "undefined") this.disabled = true;
  });
};

$.fn.enable = function () {
  this.each(function () {
    if (typeof this.disabled != "undefined") this.disabled = false;
  });
};
