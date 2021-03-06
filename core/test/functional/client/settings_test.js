// # Settings Test
// Test the various tabs on the settings page

/*globals CasperTest, casper */

// These classes relate to elements which only appear when a given tab is loaded.
// These are used to check that a switch to a tab is complete, or that we are on the right tab.
var generalTabDetector = '.settings-content form#settings-general',
    userTabDetector = '.settings-content form.user-profile';

CasperTest.begin('Settings screen is correct', 17, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/ember\/settings\/general\/$/, 'Landed on the correct URL');
    });

    casper.then(function testViews() {
        test.assertExists('.wrapper', 'Settings main view is present');
        test.assertExists('.settings-sidebar', 'Settings sidebar view is present');
        test.assertExists('.settings-menu', 'Settings menu is present');
        test.assertExists('.settings-menu .general', 'General tab is present');
        test.assertExists('.settings-menu .users', 'Users tab is present');
        test.assertNotExists('.settings-menu .apps', 'Apps is present');
        test.assertExists('.wrapper', 'Settings main view is present');
        test.assertExists('.settings-content', 'Settings content view is present');
        test.assertExists('.settings-menu .general.active', 'General tab is marked active');
        test.assertExists(generalTabDetector, 'Form is present');
        test.assertSelectorHasText('.settings-content.active h2.title', 'General', 'Title is general');
    });

    casper.then(function testSwitchingTabs() {
        casper.thenClick('.settings-menu .users a');
        casper.waitForSelector(userTabDetector, function then () {
            // assert that the right menu item is active
            test.assertExists('.settings-menu .users.active', 'User tab is active');
            test.assertDoesntExist('.settings-menu .general.active', 'General tab is not active');
        }, casper.failOnTimeout(test, 'waitForSelector `userTabDetector` timed out'));

        casper.thenClick('.settings-menu .general a');
        casper.waitForSelector(generalTabDetector, function then () {
            // assert that the right menu item is active
            test.assertExists('.settings-menu .general.active', 'General tab is active');
            test.assertDoesntExist('.settings-menu .users.active', 'User tab is not active');
        }, casper.failOnTimeout(test, 'waitForSelector `generalTabDetector` timed out'));
    });
});

// ## General settings tests
CasperTest.begin('General settings pane is correct', 8, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.general', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/ember\/settings\/general\/$/, 'Landed on the correct URL');
    });

    function assertImageUploaderModalThenClose() {
        test.assertSelectorHasText('.description', 'Add image');
        casper.click('#modal-container .js-button-accept');
        casper.waitForSelector('.notification-success', function onSuccess() {
            test.assert(true, 'Got success notification');
        }, casper.failOnTimeout(test, 'No success notification'));
    }

    // Ensure image upload modals display correctly

    // Test Blog Logo Upload Button
    casper.waitForSelector('.js-modal-logo', function () {
        casper.click('.js-modal-logo');
    });

    casper.waitForSelector('#modal-container .modal-content .js-drop-zone .description',
        assertImageUploaderModalThenClose, casper.failOnTimeout(test, 'No upload logo modal container appeared'));

    // Test Blog Cover Upload Button
    casper.waitForSelector('.js-modal-cover', function () {
        casper.click('.js-modal-cover');
    });

    casper.waitForSelector('#modal-container .modal-content .js-drop-zone .description',
        assertImageUploaderModalThenClose, casper.failOnTimeout(test, 'No upload cover modal container appeared'));

    function handleSettingsRequest(requestData) {
        // make sure we only get requests from the user pane
        if (requestData.url.indexOf('users/') !== -1) {
            test.fail('Saving a settings pane triggered the user pane to save');
        }
    }

    casper.then(function listenForRequests() {
        casper.on('resource.requested', handleSettingsRequest);
    });

    // Ensure can save
    casper.waitForSelector('header .button-save').then(function () {
        casper.thenClick('header .button-save').waitFor(function successNotification() {
            return this.evaluate(function () {
                return document.querySelectorAll('.js-bb-notification section').length > 0;
            });
        }, function doneWaiting() {
            test.pass('Waited for notification');
        }, casper.failOnTimeout(test, 'Saving the general pane did not result in a notification'));
    });

    casper.then(function checkSettingsWereSaved() {
        casper.removeListener('resource.requested', handleSettingsRequest);
    });

    casper.waitForSelector('.notification-success', function onSuccess() {
        test.assert(true, 'Got success notification');
    }, casper.failOnTimeout(test, 'No success notification :('));
});

//// ## General settings validations tests
CasperTest.begin('General settings validation is correct', 7, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.general', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/ember\/settings\/general\/$/, 'Landed on the correct URL');
    });

    // Ensure general blog title field length validation
    casper.fillAndSave('form#settings-general', {
        'general[title]': new Array(152).join('a')
    });

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'too long');
    }, casper.failOnTimeout(test, 'Blog title length error did not appear'), 2000);

    casper.thenClick('.js-bb-notification .close');

    // Ensure general blog description field length validation
    casper.fillAndSave('form#settings-general', {
        'general[description]': new Array(202).join('a')
    });

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'too long');
    }, casper.failOnTimeout(test, 'Blog description length error did not appear'));

    casper.thenClick('.js-bb-notification .close');

    // Ensure postsPerPage number field form validation
    casper.fillAndSave('form#settings-general', {
        'general[postsPerPage]': 'notaninteger'
    });

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'use a number');
    }, casper.failOnTimeout(test, 'postsPerPage error did not appear'), 2000);

    casper.thenClick('.js-bb-notification .close');

    // Ensure postsPerPage max of 1000
    casper.fillAndSave('form#settings-general', {
        'general[postsPerPage]': '1001'
    });

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'use a number less than 1000');
    }, casper.failOnTimeout(test, 'postsPerPage max error did not appear', 2000));

    casper.thenClick('.js-bb-notification .close');

    // Ensure postsPerPage min of 0
    casper.fillAndSave('form#settings-general', {
        'general[postsPerPage]': '-1'
    });

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'use a number greater than 0');
    }, casper.failOnTimeout(test, 'postsPerPage min error did not appear', 2000));
});

// ### User settings tests
// Please uncomment and fix these as the functionality is implemented

//CasperTest.begin('Can save settings', 6, function suite(test) {
//    casper.thenOpenAndWaitForPageLoad('settings.user', function testTitleAndUrl() {
//        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
//        test.assertUrlMatch(/ghost\/ember\/settings\/user\/$/, 'Landed on the correct URL');
//    });
//
//    function handleUserRequest(requestData) {
//        // make sure we only get requests from the user pane
//        if (requestData.url.indexOf('settings/') !== -1) {
//            test.fail('Saving the user pane triggered another settings pane to save');
//        }
//    }
//
//    function handleSettingsRequest(requestData) {
//        // make sure we only get requests from the user pane
//        if (requestData.url.indexOf('users/') !== -1) {
//            test.fail('Saving a settings pane triggered the user pane to save');
//        }
//    }
//
//    casper.then(function listenForRequests() {
//        casper.on('resource.requested', handleUserRequest);
//    });
//
//    casper.thenClick('#user .button-save');
//    casper.waitFor(function successNotification() {
//        return this.evaluate(function () {
//            return document.querySelectorAll('.js-bb-notification section').length > 0;
//        });
//    }, function doneWaiting() {
//        test.pass('Waited for notification');
//    }, casper.failOnTimeout(test, 'Saving the user pane did not result in a notification'));
//
//    casper.then(function checkUserWasSaved() {
//        casper.removeListener('resource.requested', handleUserRequest);
//    });
//
//    casper.waitForSelector('.notification-success', function onSuccess() {
//        test.assert(true, 'Got success notification');
//    }, casper.failOnTimeout(test, 'No success notification :('));
//
//    casper.thenClick('#main-menu .settings a').then(function testOpeningSettingsTwice() {
//        casper.on('resource.requested', handleSettingsRequest);
//        test.assertEval(function testUserIsActive() {
//            return document.querySelector('.settings-menu .general').classList.contains('active');
//        }, 'general tab is marked active');
//    });
//
//    casper.thenClick('#general .button-save').waitFor(function successNotification() {
//        return this.evaluate(function () {
//            return document.querySelectorAll('.js-bb-notification section').length > 0;
//        });
//    }, function doneWaiting() {
//        test.pass('Waited for notification');
//    },  casper.failOnTimeout(test, 'Saving the general pane did not result in a notification'));
//
//    casper.then(function checkSettingsWereSaved() {
//        casper.removeListener('resource.requested', handleSettingsRequest);
//    });
//
//    casper.waitForSelector('.notification-success', function onSuccess() {
//        test.assert(true, 'Got success notification');
//    }, casper.failOnTimeout(test, 'No success notification :('));
//
//    CasperTest.beforeDone(function () {
//        casper.removeListener('resource.requested', handleUserRequest);
//        casper.removeListener('resource.requested', handleSettingsRequest);
//    });


//
//CasperTest.begin('User settings screen validates email', 6, function suite(test) {
//    var email, brokenEmail;
//
//    casper.thenOpenAndWaitForPageLoad('settings.user', function testTitleAndUrl() {
//        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
//        test.assertUrlMatch(/ghost\/settings\/user\/$/, 'Ghost doesn\'t require login this time');
//    });
//
//    casper.then(function setEmailToInvalid() {
//        email = casper.getElementInfo('#user-email').attributes.value;
//        brokenEmail = email.replace('.', '-');
//
//        casper.fillSelectors('.user-profile', {
//            '#user-email': brokenEmail
//        }, false);
//    });
//
//    casper.thenClick('#user .button-save');
//
//    casper.waitForResource('/users/');
//
//    casper.waitForSelector('.notification-error', function onSuccess() {
//        test.assert(true, 'Got error notification');
//        test.assertSelectorDoesntHaveText('.notification-error', '[object Object]');
//    }, casper.failOnTimeout(test, 'No error notification :('));
//
//    casper.then(function resetEmailToValid() {
//        casper.fillSelectors('.user-profile', {
//            '#user-email': email
//        }, false);
//    });
//
//    casper.thenClick('#user .button-save');
//
//    casper.waitForResource(/users/);
//
//    casper.waitForSelector('.notification-success', function onSuccess() {
//        test.assert(true, 'Got success notification');
//        test.assertSelectorDoesntHaveText('.notification-success', '[object Object]');
//    }, casper.failOnTimeout(test, 'No success notification :('));
//});
//
//
// TODO: user needs to be loaded whenever it is edited (multi user)
// CasperTest.begin('User settings screen shows remaining characters for Bio properly', 4, function suite(test) {
//     casper.thenOpenAndWaitForPageLoad('settings.user', function testTitleAndUrl() {
//         test.assertTitle('Ghost Admin', 'Ghost admin has no title');
//         test.assertUrlMatch(/ghost\/ember\/settings\/user\/$/, 'Ghost doesn\'t require login this time');
//     });

//     function getRemainingBioCharacterCount() {
//         return casper.getHTML('.word-count');
//     }

//     casper.then(function checkCharacterCount() {
//         test.assert(getRemainingBioCharacterCount() === '200', 'Bio remaining characters is 200');
//     });

//     casper.then(function setBioToValid() {
//         casper.fillSelectors('.user-profile', {
//             '#user-bio': 'asdf\n' // 5 characters
//         }, false);
//     });

//     casper.then(function checkCharacterCount() {
//         test.assert(getRemainingBioCharacterCount() === '195', 'Bio remaining characters is 195');
//     });
// });

//CasperTest.begin('Ensure user bio field length validation', 3, function suite(test) {
//    casper.thenOpenAndWaitForPageLoad('settings.user', function testTitleAndUrl() {
//        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
//        test.assertUrlMatch(/ghost\/settings\/user\/$/, 'Ghost doesn\'t require login this time');
//    });
//
//    casper.waitForSelector('#user', function then() {
//        this.fillSelectors('form.user-profile', {
//            '#user-bio': new Array(202).join('a')
//        });
//    }, casper.failOnTimeout(test, 'waitForSelector #user timed out'));
//
//    casper.thenClick('#user .button-save');
//
//    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
//        test.assertSelectorHasText('.notification-error', 'is too long');
//    }, casper.failOnTimeout(test, 'Bio field length error did not appear', 2000));
//});
//
//CasperTest.begin('Ensure user url field validation', 3, function suite(test) {
//    casper.thenOpenAndWaitForPageLoad('settings.user', function testTitleAndUrl() {
//        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
//        test.assertUrlMatch(/ghost\/settings\/user\/$/, 'Ghost doesn\'t require login this time');
//    });
//
//    casper.waitForSelector('#user', function then() {
//        this.fillSelectors('form.user-profile', {
//            '#user-website': 'notaurl'
//        });
//    }, casper.failOnTimeout(test, 'waitForSelector #user timed out'));
//
//    casper.thenClick('#user .button-save');
//
//    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
//        test.assertSelectorHasText('.notification-error', 'use a valid url');
//    }, casper.failOnTimeout(test, 'Url validation error did not appear', 2000));
//});
//
//CasperTest.begin('Ensure user location field length validation', 3, function suite(test) {
//    casper.thenOpenAndWaitForPageLoad('settings.user', function testTitleAndUrl() {
//        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
//        test.assertUrlMatch(/ghost\/settings\/user\/$/, 'Ghost doesn\'t require login this time');
//    });
//
//    casper.waitForSelector('#user', function then() {
//        this.fillSelectors('form.user-profile', {
//            '#user-location': new Array(1002).join('a')
//        });
//    }, casper.failOnTimeout(test, 'waitForSelector #user timed out'));
//
//    casper.thenClick('#user .button-save');
//
//    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
//        test.assertSelectorHasText('.notification-error', 'is too long');
//    }, casper.failOnTimeout(test, 'Location field length error did not appear', 2000));
//});