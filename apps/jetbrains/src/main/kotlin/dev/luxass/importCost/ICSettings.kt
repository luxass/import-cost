package dev.luxass.importCost

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
@State(name = "ImportCostSettings", storages = [Storage("import-cost.xml")])
class ICSettings : PersistentStateComponent<ICSettings.State> {

    data class State(
        var enable: Boolean = true,
        var decorator: DecoratorKind = DecoratorKind.Both,
        var sizeColor: SizeColor = SizeColor.MINIFIED,
        var colors: Map<Colors, ColorsObject> = mapOf(
            Colors.Small to ColorsObject("#7cc36e", "#7cc36e"),
            Colors.Medium to ColorsObject("#7cc36e", "#7cc36e"),
            Colors.Large to ColorsObject("#d44e40", "#d44e40"),
            Colors.Extreme to ColorsObject("#d44e40", "#d44e40")
        ),
        var sizes: Map<Sizes, Int> = mapOf(
            Sizes.Small to 10,
            Sizes.Medium to 1500,
            Sizes.Large to 1500,
        ),
        var externals: List<String> = listOf(),
        var skip: List<String> = listOf(),
        var platform: Platform = Platform.Node,
        var platforms: Map<String, Platform> = mapOf(),
        var format: Format = Format.ESM,
        var formats: Map<String, Format> = mapOf(),
        var fallback: PackageManager = PackageManager.Npm,
        var packageManager: PackageManager = PackageManager.Auto,
    )

    private var state = State()

    override fun getState(): State {
        return state
    }

    override fun loadState(state: State) {
        this.state = state
    }

    var decorator: DecoratorKind
        get() = state.decorator
        set(decorator) {
            state.decorator = decorator
        }

    val decoratorIndex: Int
        get() {
            val type = decorator
            return DecoratorKind.values().indices.firstOrNull { type == DecoratorKind.values()[it] } ?: 0
        }
    data class ColorsObject(val dark: String, val light: String)

    enum class Colors(private val value: String) {
        Small("small"),
        Medium("medium"),
        Large("large"),
        Extreme("extreme");

        override fun toString(): String {
            return value;
        }
    }

    enum class Sizes(private val value: String) {
        Small("small"),
        Medium("medium"),
        Large("large");

        override fun toString(): String {
            return value;
        }
    }

    enum class SizeColor(private val value: String) {
        MINIFIED("minified"),
        COMPRESSED("compressed");

        override fun toString(): String {
            return value;
        }
    }

    enum class Platform(private val value: String) {
        Node("node"),
        Web("web"),
        Neutral("neutral");

        override fun toString(): String {
            return value;
        }
    }

    enum class Format(private val value: String) {
        IIFE("iife"),
        CJS("cjs"),
        ESM("esm");

        override fun toString(): String {
            return value;
        }
    }

    enum class DecoratorKind(private val value: String) {
        Minified("minified"),
        Compressed("compressed"),
        Both("both");

        override fun toString(): String {
            return value;
        }
    }

    enum class PackageManager(private val value: String) {
        Npm("npm"),
        Yarn("yarn"),
        Pnpm("pnpm"),
        Auto("auto");

        override fun toString(): String {
            return value;
        }
    }

    companion object {
        val instance: ICSettings
            get() = ApplicationManager.getApplication().getService(ICSettings::class.java)
    }
}