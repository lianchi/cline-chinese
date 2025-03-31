import { useCallback, useState, useRef, useMemo } from "react"
import styled from "styled-components"
import { McpMarketplaceItem, McpServer } from "../../../../../src/shared/mcp"
import { vscode } from "../../../utils/vscode"
import { useEvent } from "react-use"

interface McpMarketplaceCardProps {
	item: McpMarketplaceItem
	installedServers: McpServer[]
}

const McpMarketplaceCard = ({ item, installedServers }: McpMarketplaceCardProps) => {
	const isInstalled = installedServers.some((server) => server.name === item.mcpId)
	const [isDownloading, setIsDownloading] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const githubLinkRef = useRef<HTMLDivElement>(null)

	const handleMessage = useCallback((event: MessageEvent) => {
		const message = event.data
		switch (message.type) {
			case "mcpDownloadDetails":
				setIsDownloading(false)
				break
			case "relinquishControl":
				setIsLoading(false)
				break
		}
	}, [])

	useEvent("message", handleMessage)

	const githubAuthorUrl = useMemo(() => {
		const url = new URL(item.githubUrl)
		const pathParts = url.pathname.split("/")
		if (pathParts.length >= 2) {
			return `${url.origin}/${pathParts[1]}`
		}
		return item.githubUrl
	}, [item.githubUrl])

	return (
		<>
			<style>
				{`
					.mcp-card {
						cursor: pointer;
						outline: none !important;
					}
					.mcp-card:hover {
						background-color: var(--vscode-list-hoverBackground);
					}
					.mcp-card:focus {
						outline: none !important;
					}
				`}
			</style>
			<a
				href={item.githubUrl}
				className="mcp-card"
				style={{
					padding: "14px 16px",
					display: "flex",
					flexDirection: "column",
					gap: 12,
					cursor: isLoading ? "wait" : "pointer",
					textDecoration: "none",
					color: "inherit",
				}}>
				{/* 包含 logo 和内容的主容器 */}
				<div style={{ display: "flex", gap: "12px" }}>
					{/* Logo */}
					{item.logoUrl && (
						<img
							src={item.logoUrl}
							alt={`${item.name} 标志`}
							style={{
								width: 42,
								height: 42,
								borderRadius: 4,
							}}
						/>
					)}

					{/* 内容部分 */}
					<div
						style={{
							flex: 1,
							minWidth: 0,
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-between",
						}}>
						{/* 第一行：名称和安装按钮 */}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								gap: "16px",
							}}>
							<h3
								style={{
									margin: 0,
									fontSize: "13px",
									fontWeight: 600,
								}}>
								{item.name}
							</h3>
							<div
								onClick={(e) => {
									e.preventDefault() // 防止点击安装时触发卡片点击
									e.stopPropagation() // 阻止事件冒泡到父链接
									if (!isInstalled && !isDownloading) {
										setIsDownloading(true)
										vscode.postMessage({
											type: "downloadMcp",
											mcpId: item.mcpId,
										})
									}
								}}
								style={{}}>
								<StyledInstallButton disabled={isInstalled || isDownloading} $isInstalled={isInstalled}>
									{isInstalled ? "已安装" : isDownloading ? "正在安装..." : "安装"}
								</StyledInstallButton>
							</div>
						</div>

						{/* 第二行：元数据 */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
								fontSize: "12px",
								color: "var(--vscode-descriptionForeground)",
								flexWrap: "wrap",
								minWidth: 0,
								rowGap: 0,
							}}>
							<a
								href={githubAuthorUrl}
								style={{
									display: "flex",
									alignItems: "center",
									color: "var(--vscode-foreground)",
									minWidth: 0,
									opacity: 0.7,
									textDecoration: "none",
									border: "none !important",
								}}
								className="github-link"
								onMouseEnter={(e) => {
									e.currentTarget.style.opacity = "1"
									e.currentTarget.style.color = "var(--link-active-foreground)"
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.opacity = "0.7"
									e.currentTarget.style.color = "var(--vscode-foreground)"
								}}>
								<div style={{ display: "flex", gap: "4px", alignItems: "center" }} ref={githubLinkRef}>
									<span className="codicon codicon-github" style={{ fontSize: "14px" }} />
									<span
										style={{
											overflow: "hidden",
											textOverflow: "ellipsis",
											wordBreak: "break-all",
											minWidth: 0,
										}}>
										{item.author}
									</span>
								</div>
							</a>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "4px",
									minWidth: 0,
									flexShrink: 0,
								}}>
								<span className="codicon codicon-star-full" />
								<span style={{ wordBreak: "break-all" }}>{item.githubStars?.toLocaleString() ?? 0}</span>
							</div>
							{/* <div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "4px",
									minWidth: 0,
									flexShrink: 0,
								}}>
								<span className="codicon codicon-cloud-download" />
								<span style={{ wordBreak: "break-all" }}>{item.downloadCount?.toLocaleString() ?? 0}</span>
							</div> */}
							{item.requiresApiKey && (
								<span className="codicon codicon-key" title="需要 API 密钥" style={{ flexShrink: 0 }} />
							)}
						</div>
					</div>
				</div>

				{/* 描述和标签 */}
				<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					{/* {!item.isRecommended && (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "4px",
								fontSize: "12px",
								color: "var(--vscode-notificationsWarningIcon-foreground)",
								marginTop: -3,
								marginBottom: -3,
							}}>
							<span className="codicon codicon-warning" style={{ fontSize: "14px" }} />
							<span>社区制作（使用风险自负）</span>
						</div>
					)} */}

					<p style={{ fontSize: "13px", margin: 0 }}>{item.description}</p>
					<div
						style={{
							display: "flex",
							gap: "6px",
							flexWrap: "nowrap",
							overflowX: "auto",
							scrollbarWidth: "none",
							position: "relative",
						}}
						onScroll={(e) => {
							const target = e.currentTarget
							const gradient = target.querySelector(".tags-gradient") as HTMLElement
							if (gradient) {
								gradient.style.visibility = target.scrollLeft > 0 ? "hidden" : "visible"
							}
						}}>
						<span
							style={{
								fontSize: "10px",
								padding: "1px 4px",
								borderRadius: "3px",
								border: "1px solid color-mix(in srgb, var(--vscode-descriptionForeground) 50%, transparent)",
								color: "var(--vscode-descriptionForeground)",
								whiteSpace: "nowrap",
							}}>
							{item.category}
						</span>
						{item.tags.map((tag, index) => (
							<span
								key={tag}
								style={{
									fontSize: "10px",
									padding: "1px 4px",
									borderRadius: "3px",
									border: "1px solid color-mix(in srgb, var(--vscode-descriptionForeground) 50%, transparent)",
									color: "var(--vscode-descriptionForeground)",
									whiteSpace: "nowrap",
									display: "inline-flex",
								}}>
								{tag}
								{index === item.tags.length - 1 ? "" : ""}
							</span>
						))}
						<div
							className="tags-gradient"
							style={{
								position: "absolute",
								right: 0,
								top: 0,
								bottom: 0,
								width: "32px",
								background: "linear-gradient(to right, transparent, var(--vscode-sideBar-background))",
								pointerEvents: "none",
							}}
						/>
					</div>
				</div>
			</a>
		</>
	)
}

const StyledInstallButton = styled.button<{ $isInstalled?: boolean }>`
	font-size: 12px;
	font-weight: 500;
	padding: 2px 6px;
	border-radius: 2px;
	border: none;
	cursor: pointer;
	background: ${(props) =>
		props.$isInstalled ? "var(--vscode-button-secondaryBackground)" : "var(--vscode-button-background)"};
	color: var(--vscode-button-foreground);

	&:hover:not(:disabled) {
		background: ${(props) =>
			props.$isInstalled ? "var(--vscode-button-secondaryHoverBackground)" : "var(--vscode-button-hoverBackground)"};
	}

	&:active:not(:disabled) {
		background: ${(props) =>
			props.$isInstalled ? "var(--vscode-button-secondaryBackground)" : "var(--vscode-button-background)"};
		opacity: 0.7;
	}

	&:disabled {
		opacity: 0.5;
		cursor: default;
	}
`

export default McpMarketplaceCard
