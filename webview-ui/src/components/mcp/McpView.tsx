import {
	VSCodeButton,
	VSCodeLink,
	VSCodePanels,
	VSCodePanelTab,
	VSCodePanelView,
	VSCodeDropdown,
	VSCodeOption,
} from "@vscode/webview-ui-toolkit/react"
import { useEffect, useState } from "react"
import styled from "styled-components"
import { DEFAULT_MCP_TIMEOUT_SECONDS, McpServer } from "../../../../src/shared/mcp"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { getMcpServerDisplayName } from "../../utils/mcp"
import { vscode } from "../../utils/vscode"
import McpMarketplaceView from "./marketplace/McpMarketplaceView"
import McpResourceRow from "./McpResourceRow"
import McpToolRow from "./McpToolRow"
import DangerButton from "../common/DangerButton"

type McpViewProps = {
	onDone: () => void
}

const McpView = ({ onDone }: McpViewProps) => {
	const { mcpServers: servers, mcpMarketplaceEnabled } = useExtensionState()
	const [activeTab, setActiveTab] = useState(mcpMarketplaceEnabled ? "marketplace" : "installed")

	const handleTabChange = (tab: string) => {
		setActiveTab(tab)
	}

	useEffect(() => {
		if (!mcpMarketplaceEnabled && activeTab === "marketplace") {
			// 如果市场被禁用并且我们在市场选项卡上，则切换到已安装
			setActiveTab("installed")
		}
	}, [mcpMarketplaceEnabled, activeTab])

	useEffect(() => {
		if (mcpMarketplaceEnabled) {
			vscode.postMessage({ type: "silentlyRefreshMcpMarketplace" })
			vscode.postMessage({ type: "fetchLatestMcpServersFromHub" })
		}
	}, [mcpMarketplaceEnabled])

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				display: "flex",
				flexDirection: "column",
			}}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "10px 17px 5px 20px",
				}}>
				<h3 style={{ color: "var(--vscode-foreground)", margin: 0 }}>MCP 服务器</h3>
				<VSCodeButton onClick={onDone}>完成</VSCodeButton>
			</div>

			<div style={{ flex: 1, overflow: "auto" }}>
				{/* 选项卡容器 */}
				<div
					style={{
						display: "flex",
						gap: "1px",
						padding: "0 20px 0 20px",
						borderBottom: "1px solid var(--vscode-panel-border)",
					}}>
					{mcpMarketplaceEnabled && (
						<TabButton isActive={activeTab === "marketplace"} onClick={() => handleTabChange("marketplace")}>
							市场
						</TabButton>
					)}
					<TabButton isActive={activeTab === "installed"} onClick={() => handleTabChange("installed")}>
						已安装
					</TabButton>
				</div>

				{/* 内容容器 */}
				<div style={{ width: "100%" }}>
					{mcpMarketplaceEnabled && activeTab === "marketplace" && <McpMarketplaceView />}
					{activeTab === "installed" && (
						<div style={{ padding: "16px 20px" }}>
							<div
								style={{
									color: "var(--vscode-foreground)",
									fontSize: "13px",
									marginBottom: "16px",
									marginTop: "5px",
								}}>
								{" "}
								<VSCodeLink href="https://github.com/modelcontextprotocol" style={{ display: "inline" }}>
									模型上下文协议
								</VSCodeLink>{" "}
								允许与本地运行的 MCP 服务器通信，这些服务器提供额外的工具和资源来扩展天熠小码的能力。您可以使用{" "}
								<VSCodeLink href="https://github.com/modelcontextprotocol/servers" style={{ display: "inline" }}>
									社区制作的服务器
								</VSCodeLink>{" "}
								或要求天熠小码为您的工作流程创建新工具（例如，“添加一个获取最新 npm 文档的工具”）。{" "}
								<VSCodeLink href="https://x.com/sdrzn/status/1867271665086074969" style={{ display: "inline" }}>
									在此处查看演示。
								</VSCodeLink>
							</div>

							{servers.length > 0 ? (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "10px",
									}}>
									{servers.map((server) => (
										<ServerRow key={server.name} server={server} />
									))}
								</div>
							) : (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										gap: "12px",
										marginTop: 20,
										marginBottom: 20,
										color: "var(--vscode-descriptionForeground)",
									}}>
									未安装 MCP 服务器
								</div>
							)}

							{/* 设置部分 */}
							<div style={{ marginBottom: "20px", marginTop: 10 }}>
								<VSCodeButton
									appearance="secondary"
									style={{ width: "100%", marginBottom: "5px" }}
									onClick={() => {
										vscode.postMessage({ type: "openMcpSettings" })
									}}>
									<span className="codicon codicon-server" style={{ marginRight: "6px" }}></span>
									配置 MCP 服务器
								</VSCodeButton>

								<div style={{ textAlign: "center" }}>
									<VSCodeLink
										onClick={() => {
											vscode.postMessage({
												type: "openExtensionSettings",
												text: "clineChinese.mcp",
											})
										}}
										style={{ fontSize: "12px" }}>
										高级 MCP 设置
									</VSCodeLink>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

const StyledTabButton = styled.button<{ isActive: boolean }>`
	background: none;
	border: none;
	border-bottom: 2px solid ${(props) => (props.isActive ? "var(--vscode-foreground)" : "transparent")};
	color: ${(props) => (props.isActive ? "var(--vscode-foreground)" : "var(--vscode-descriptionForeground)")};
	padding: 8px 16px;
	cursor: pointer;
	font-size: 13px;
	margin-bottom: -1px;
	font-family: inherit;

	&:hover {
		color: var(--vscode-foreground);
	}
`

export const TabButton = ({
	children,
	isActive,
	onClick,
}: {
	children: React.ReactNode
	isActive: boolean
	onClick: () => void
}) => (
	<StyledTabButton isActive={isActive} onClick={onClick}>
		{children}
	</StyledTabButton>
)

// 服务器行组件
const ServerRow = ({ server }: { server: McpServer }) => {
	const { mcpMarketplaceCatalog } = useExtensionState()

	const [isExpanded, setIsExpanded] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	const getStatusColor = () => {
		switch (server.status) {
			case "connected":
				return "var(--vscode-testing-iconPassed)" // 已连接
			case "connecting":
				return "var(--vscode-charts-yellow)" // 连接中
			case "disconnected":
				return "var(--vscode-testing-iconFailed)" // 已断开
		}
	}

	const handleRowClick = () => {
		if (!server.error) {
			setIsExpanded(!isExpanded)
		}
	}

	const [timeoutValue, setTimeoutValue] = useState<string>(() => {
		try {
			const config = JSON.parse(server.config)
			return config.timeout?.toString() || DEFAULT_MCP_TIMEOUT_SECONDS.toString()
		} catch {
			return DEFAULT_MCP_TIMEOUT_SECONDS.toString()
		}
	})

	const timeoutOptions = [
		{ value: "30", label: "30 秒" },
		{ value: "60", label: "1 分钟" },
		{ value: "300", label: "5 分钟" },
		{ value: "600", label: "10 分钟" },
		{ value: "1800", label: "30 分钟" },
		{ value: "3600", label: "1 小时" },
	]

	const handleTimeoutChange = (e: any) => {
		const select = e.target as HTMLSelectElement
		const value = select.value
		const num = parseInt(value)
		setTimeoutValue(value)
		vscode.postMessage({
			type: "updateMcpTimeout",
			serverName: server.name,
			timeout: num,
		})
	}

	const handleRestart = () => {
		vscode.postMessage({
			type: "restartMcpServer",
			text: server.name,
		})
	}

	const handleDelete = () => {
		setIsDeleting(true)
		vscode.postMessage({
			type: "deleteMcpServer",
			serverName: server.name,
		})
	}

	return (
		<div style={{ marginBottom: "10px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					padding: "8px",
					background: "var(--vscode-textCodeBlock-background)",
					cursor: server.error ? "default" : "pointer",
					borderRadius: isExpanded || server.error ? "4px 4px 0 0" : "4px",
					opacity: server.disabled ? 0.6 : 1,
				}}
				onClick={handleRowClick}>
				{!server.error && (
					<span className={`codicon codicon-chevron-${isExpanded ? "down" : "right"}`} style={{ marginRight: "8px" }} />
				)}
				<span
					style={{
						flex: 1,
						overflow: "hidden",
						wordBreak: "break-all",
						whiteSpace: "normal",
						display: "flex",
						alignItems: "center",
						marginRight: "4px",
					}}>
					{getMcpServerDisplayName(server.name, mcpMarketplaceCatalog)}
				</span>
				<div style={{ display: "flex", alignItems: "center", marginRight: "8px" }} onClick={(e) => e.stopPropagation()}>
					<div
						role="switch"
						aria-checked={!server.disabled}
						tabIndex={0}
						style={{
							width: "20px",
							height: "10px",
							backgroundColor: server.disabled
								? "var(--vscode-titleBar-inactiveForeground)"
								: "var(--vscode-testing-iconPassed)",
							borderRadius: "5px",
							position: "relative",
							cursor: "pointer",
							transition: "background-color 0.2s",
							opacity: server.disabled ? 0.5 : 0.9,
						}}
						onClick={() => {
							vscode.postMessage({
								type: "toggleMcpServer",
								serverName: server.name,
								disabled: !server.disabled,
							})
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault()
								vscode.postMessage({
									type: "toggleMcpServer",
									serverName: server.name,
									disabled: !server.disabled,
								})
							}
						}}>
						<div
							style={{
								width: "6px",
								height: "6px",
								backgroundColor: "white",
								border: "1px solid color-mix(in srgb, #666666 65%, transparent)",
								borderRadius: "50%",
								position: "absolute",
								top: "1px",
								left: server.disabled ? "2px" : "12px",
								transition: "left 0.2s",
							}}
						/>
					</div>
				</div>
				<div
					style={{
						width: "8px",
						height: "8px",
						borderRadius: "50%",
						background: getStatusColor(),
						marginLeft: "8px",
					}}
				/>
			</div>

			{server.error ? (
				<div
					style={{
						fontSize: "13px",
						background: "var(--vscode-textCodeBlock-background)",
						borderRadius: "0 0 4px 4px",
						width: "100%",
					}}>
					<div
						style={{
							color: "var(--vscode-testing-iconFailed)",
							marginBottom: "8px",
							padding: "0 10px",
							overflowWrap: "break-word",
							wordBreak: "break-word",
						}}>
						{server.error}
					</div>
					<VSCodeButton
						appearance="secondary"
						onClick={handleRestart}
						disabled={server.status === "connecting"}
						style={{
							width: "calc(100% - 20px)",
							margin: "0 10px 10px 10px",
						}}>
						{server.status === "connecting" ? "正在重试..." : "重试连接"}
					</VSCodeButton>

					<DangerButton
						style={{ width: "calc(100% - 20px)", margin: "0 10px 10px 10px" }}
						disabled={isDeleting}
						onClick={handleDelete}>
						{isDeleting ? "正在删除..." : "删除服务器"}
					</DangerButton>
				</div>
			) : (
				isExpanded && (
					<div
						style={{
							background: "var(--vscode-textCodeBlock-background)",
							padding: "0 10px 10px 10px",
							fontSize: "13px",
							borderRadius: "0 0 4px 4px",
						}}>
						<VSCodePanels>
							<VSCodePanelTab id="tools">工具 ({server.tools?.length || 0})</VSCodePanelTab>
							<VSCodePanelTab id="resources">
								资源 ({[...(server.resourceTemplates || []), ...(server.resources || [])].length || 0})
							</VSCodePanelTab>

							<VSCodePanelView id="tools-view">
								{server.tools && server.tools.length > 0 ? (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "8px",
											width: "100%",
										}}>
										{server.tools.map((tool) => (
											<McpToolRow key={tool.name} tool={tool} serverName={server.name} />
										))}
									</div>
								) : (
									<div
										style={{
											padding: "10px 0",
											color: "var(--vscode-descriptionForeground)",
										}}>
										未找到工具
									</div>
								)}
							</VSCodePanelView>

							<VSCodePanelView id="resources-view">
								{(server.resources && server.resources.length > 0) ||
								(server.resourceTemplates && server.resourceTemplates.length > 0) ? (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "8px",
											width: "100%",
										}}>
										{[...(server.resourceTemplates || []), ...(server.resources || [])].map((item) => (
											<McpResourceRow
												key={"uriTemplate" in item ? item.uriTemplate : item.uri}
												item={item}
											/>
										))}
									</div>
								) : (
									<div
										style={{
											padding: "10px 0",
											color: "var(--vscode-descriptionForeground)",
										}}>
										未找到资源
									</div>
								)}
							</VSCodePanelView>
						</VSCodePanels>

						<div style={{ margin: "10px 7px" }}>
							<label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>请求超时</label>
							<VSCodeDropdown style={{ width: "100%" }} value={timeoutValue} onChange={handleTimeoutChange}>
								{timeoutOptions.map((option) => (
									<VSCodeOption key={option.value} value={option.value}>
										{option.label}
									</VSCodeOption>
								))}
							</VSCodeDropdown>
						</div>
						<VSCodeButton
							appearance="secondary"
							onClick={handleRestart}
							disabled={server.status === "connecting"}
							style={{
								width: "calc(100% - 14px)",
								margin: "0 7px 3px 7px",
							}}>
							{server.status === "connecting" ? "正在重启..." : "重启服务器"}
						</VSCodeButton>

						<DangerButton
							style={{ width: "calc(100% - 14px)", margin: "5px 7px 3px 7px" }}
							disabled={isDeleting}
							onClick={handleDelete}>
							{isDeleting ? "正在删除..." : "删除服务器"}
						</DangerButton>
					</div>
				)
			)}
		</div>
	)
}

export default McpView
