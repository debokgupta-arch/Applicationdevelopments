package com.homeshift.app.ui

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.homeshift.app.R
import com.homeshift.app.ui.theme.HomeShiftTheme
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BottomNavigationTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private fun str(id: Int) = context.getString(id)

    @Before
    fun setUp() {
        composeRule.setContent { HomeShiftTheme { HomeShiftApp() } }
    }

    @Test
    fun startsOnHome() {
        composeRule.onNodeWithText(str(R.string.home_title)).assertIsDisplayed()
    }

    @Test
    fun tabsSwitchScreens() {
        composeRule.onNodeWithText(str(R.string.nav_tasks)).performClick()
        composeRule.onNodeWithText(str(R.string.tasks_placeholder)).assertIsDisplayed()
        composeRule.onNodeWithContentDescription(str(R.string.cd_add_item)).assertIsDisplayed()

        composeRule.onNodeWithText(str(R.string.nav_plan)).performClick()
        composeRule.onNodeWithText(str(R.string.plan_placeholder)).assertIsDisplayed()

        composeRule.onNodeWithText(str(R.string.nav_vendors)).performClick()
        composeRule.onNodeWithText(str(R.string.vendors_placeholder)).assertIsDisplayed()
    }

    @Test
    fun moduleDetailBackReturnsHome() {
        composeRule.onNodeWithText(str(R.string.home_open_sample_module)).performClick()
        composeRule.onNodeWithContentDescription(str(R.string.cd_back)).performClick()
        composeRule.onNodeWithText(str(R.string.home_title)).assertIsDisplayed()
    }
}
