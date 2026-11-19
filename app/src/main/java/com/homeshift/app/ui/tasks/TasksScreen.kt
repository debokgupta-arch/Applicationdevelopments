package com.homeshift.app.ui.tasks

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import com.homeshift.app.R
import com.homeshift.app.ui.components.AddFab
import com.homeshift.app.ui.components.HomeShiftTopBar
import com.homeshift.app.ui.components.PlaceholderContent
import com.homeshift.app.ui.theme.HomeShiftTheme

@Composable
fun TasksScreen(
    onAddClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier,
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { HomeShiftTopBar(title = stringResource(R.string.tasks_title)) },
        floatingActionButton = { AddFab(onClick = onAddClick) },
    ) { padding ->
        PlaceholderContent(
            message = stringResource(R.string.tasks_placeholder),
            modifier = Modifier.padding(padding),
        )
    }
}

@Preview(showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun TasksScreenPreview() {
    HomeShiftTheme { TasksScreen(onAddClick = {}) }
}
