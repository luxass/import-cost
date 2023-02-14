package dev.luxass.importCost

import com.intellij.openapi.options.Configurable
import org.jetbrains.annotations.Nls
import javax.swing.JComboBox
import javax.swing.JComponent
import javax.swing.JPanel

class ICConfigurable : Configurable {
    private lateinit var panel: JPanel
    private lateinit var decoratorComboBox: JComboBox<ICSettings.DecoratorKind>

    override fun getDisplayName() = "Import Cost"

    override fun createComponent(): JComponent {

        return panel
    }

    private fun init() {
        for (type in ICSettings.DecoratorKind.values()) {
            decoratorComboBox.addItem(type)
        }

        val settings = ICSettings.instance

        decoratorComboBox.selectedIndex = settings.decoratorIndex

    }

    override fun isModified(): Boolean {
        val settings = ICSettings.instance
        return decoratorComboBox.selectedItem !== settings.decorator
    }

    override fun apply() {
        val settings = ICSettings.instance

        settings.decorator = decoratorComboBox.selectedItem as ICSettings.DecoratorKind
    }

    override fun reset() {
        init()
    }
}