package com.homeshift.app.ui.module

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
fun ModuleDetailScreen(
    moduleId: Long,
    onBack: () -> Unit,
    onAddClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier,
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { HomeShiftTopBar(title = stringResource(R.string.module_title), onBack = onBack) },
        floatingActionButton = { AddFab(onClick = onAddClick) },
    ) { padding ->
        PlaceholderContent(
            message = stringResource(R.string.module_placeholder, moduleId),
            modifier = Modifier.padding(padding),
        )
    }
}

@Preview(showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun ModuleDetailScreenPreview() {
    HomeShiftTheme { ModuleDetailScreen(moduleId = 1L, onBack = {}, onAddClick = {}) }
}
